#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readFileSync, promises as fs } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";

const cwd = process.cwd();

function loadEnvFromFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const source = readFileSync(filePath, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFromFile(path.join(cwd, ".env"));
loadEnvFromFile(path.join(cwd, ".env.local"));

const env = process.env;

const primaryKeyByTable = {
  bookings: "id",
  customer_accounts: "email",
  professionals: "id",
  businesses: "id",
  business_services: "id",
  global_service_catalog: "id",
  business_memberships: "id",
  business_join_requests: "id",
  business_staff_invitations: "id",
  calendar_appointments: "id",
  pro_clients: "id",
  support_tickets: "id",
  support_messages: "id"
};

const restoreOrder = [
  "customer_accounts",
  "professionals",
  "businesses",
  "global_service_catalog",
  "bookings",
  "business_memberships",
  "business_services",
  "business_join_requests",
  "business_staff_invitations",
  "calendar_appointments",
  "pro_clients",
  "support_tickets",
  "support_messages"
];

function log(message) {
  console.log(`[db-restore] ${message}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    input: "",
    truncate: false,
    yes: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--input") {
      parsed.input = (args[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--truncate") {
      parsed.truncate = true;
      continue;
    }
    if (arg === "--yes") {
      parsed.yes = true;
    }
  }

  return parsed;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "pipe",
      ...options
    });

    let stderr = "";
    let stdout = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} exited with code ${code}\n${stderr || stdout}`));
    });
  });
}

async function hasExecutable(command) {
  try {
    await runCommand(command, ["--version"]);
    return true;
  } catch {
    return false;
  }
}

function getDatabaseUrl() {
  return (env.SUPABASE_DB_URL || env.DATABASE_URL || "").trim();
}

function getSupabaseClient() {
  const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) are required."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function readManifest(backupDir) {
  const manifestPath = path.join(backupDir, "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf8");
  return JSON.parse(raw);
}

function resolveTableRestoreOrder(tableNames) {
  const known = new Set(tableNames);
  const ordered = restoreOrder.filter((table) => known.has(table));
  const extras = tableNames.filter((table) => !ordered.includes(table));
  return [...ordered, ...extras];
}

async function restorePgDump(backupDir) {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("SUPABASE_DB_URL or DATABASE_URL is required for pg_dump restore.");
  }

  const pgRestoreExists = await hasExecutable("pg_restore");
  if (!pgRestoreExists) {
    throw new Error("pg_restore is not available in PATH.");
  }

  const dumpFile = path.join(backupDir, "database.dump");
  await fs.access(dumpFile);

  log("Running pg_restore...");
  await runCommand("pg_restore", [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--dbname",
    databaseUrl,
    dumpFile
  ]);

  log("Restore completed via pg_restore.");
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function removeExistingRows(supabase, tableName, primaryKey) {
  const { error } = await supabase.from(tableName).delete().not(primaryKey, "is", null);
  if (error) {
    throw new Error(`Failed to clear table ${tableName}: ${error.message}`);
  }
}

async function restoreSupabaseJson(backupDir, { truncate }) {
  const manifest = await readManifest(backupDir);
  const tableEntries = Array.isArray(manifest.tables) ? manifest.tables : [];
  const byName = new Map(tableEntries.map((entry) => [entry.table, entry]));
  const orderedNames = resolveTableRestoreOrder(tableEntries.map((entry) => entry.table));
  const supabase = getSupabaseClient();

  if (truncate) {
    const deleteOrder = [...orderedNames].reverse();
    for (const tableName of deleteOrder) {
      const primaryKey = primaryKeyByTable[tableName];
      if (!primaryKey) {
        throw new Error(`Missing primary key mapping for ${tableName}.`);
      }
      log(`Clearing ${tableName}...`);
      await removeExistingRows(supabase, tableName, primaryKey);
    }
  }

  for (const tableName of orderedNames) {
    const entry = byName.get(tableName);
    if (!entry || entry.skipped) {
      continue;
    }

    const primaryKey = primaryKeyByTable[tableName];
    if (!primaryKey) {
      throw new Error(`Missing primary key mapping for ${tableName}.`);
    }

    const filePath = path.join(backupDir, entry.file);
    const compressed = await fs.readFile(filePath);
    const rows = JSON.parse(gunzipSync(compressed).toString("utf8"));
    const chunks = chunkArray(Array.isArray(rows) ? rows : [], 200);

    log(`Restoring ${tableName} (${rows.length} rows)...`);
    for (const chunk of chunks) {
      const { error } = await supabase.from(tableName).upsert(chunk, { onConflict: primaryKey });
      if (error) {
        throw new Error(`Failed to restore table ${tableName}: ${error.message}`);
      }
    }
  }

  log("Restore completed via Supabase JSON backup.");
}

async function findLatestBackupDir(backupRoot) {
  const entries = await fs.readdir(backupRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  if (directories.length === 0) {
    throw new Error(`No backups found in ${backupRoot}`);
  }

  return path.join(backupRoot, directories[0]);
}

async function resolveInputBackup(inputArg) {
  if (inputArg) {
    return path.resolve(cwd, inputArg);
  }
  const backupRoot = path.resolve(cwd, env.DB_BACKUP_DIR || "backups/db");
  return findLatestBackupDir(backupRoot);
}

async function main() {
  const args = parseArgs();
  const confirmed = args.yes || env.DB_RESTORE_CONFIRM === "YES";

  if (!confirmed) {
    throw new Error(
      "Restore is blocked. Set DB_RESTORE_CONFIRM=YES or pass --yes to acknowledge destructive action."
    );
  }

  const backupDir = await resolveInputBackup(args.input);
  const manifest = await readManifest(backupDir);

  log(`Backup source: ${backupDir}`);
  log(`Detected strategy: ${manifest.strategy}`);

  if (manifest.strategy === "pg_dump") {
    await restorePgDump(backupDir);
    return;
  }

  if (manifest.strategy === "supabase-json") {
    await restoreSupabaseJson(backupDir, { truncate: args.truncate });
    return;
  }

  throw new Error(`Unsupported backup strategy: ${manifest.strategy}`);
}

main().catch((error) => {
  console.error(`[db-restore] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

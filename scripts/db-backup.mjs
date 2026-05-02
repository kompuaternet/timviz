#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readFileSync, promises as fs } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
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

const mode = (env.DB_BACKUP_MODE || "auto").trim().toLowerCase();
const backupRoot = path.resolve(cwd, env.DB_BACKUP_DIR || "backups/db");
const keepCount = Math.max(1, Number.parseInt(env.DB_BACKUP_KEEP || "14", 10) || 14);
const pageSize = Math.max(100, Number.parseInt(env.DB_BACKUP_PAGE_SIZE || "1000", 10) || 1000);
const schemaFilePath = path.resolve(cwd, "supabase/schema.sql");

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(backupRoot, timestamp);

function log(message) {
  console.log(`[db-backup] ${message}`);
}

function isMissingTableError(message, tableName) {
  if (typeof message !== "string") return false;
  return (
    message.includes(`Could not find the table 'public.${tableName}'`) ||
    message.toLowerCase().includes(`relation "public.${tableName}" does not exist`)
  );
}

function parseTableListFromSchemaSql(schemaSql) {
  const tables = new Set();
  const regex = /create\s+table\s+if\s+not\s+exists\s+public\.([a-z0-9_]+)/gi;
  let match;
  while ((match = regex.exec(schemaSql)) !== null) {
    if (match[1]) {
      tables.add(match[1]);
    }
  }
  return [...tables];
}

async function readTableList() {
  const explicit = (env.DB_BACKUP_TABLES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (explicit.length > 0) {
    return explicit;
  }

  const schemaSql = await fs.readFile(schemaFilePath, "utf8");
  const tables = parseTableListFromSchemaSql(schemaSql);
  if (tables.length === 0) {
    throw new Error("Could not detect tables from supabase/schema.sql and DB_BACKUP_TABLES is empty.");
  }

  return tables;
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

async function backupWithPgDump() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("SUPABASE_DB_URL or DATABASE_URL is required for pg_dump backup mode.");
  }

  const pgDumpExists = await hasExecutable("pg_dump");
  if (!pgDumpExists) {
    throw new Error("pg_dump is not available in PATH.");
  }

  await fs.mkdir(backupDir, { recursive: true });

  const dumpFile = path.join(backupDir, "database.dump");
  const schemaFile = path.join(backupDir, "schema.sql");

  log("Running pg_dump (custom format)...");
  await runCommand("pg_dump", [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file",
    dumpFile,
    databaseUrl
  ]);

  log("Running pg_dump (schema only)...");
  await runCommand("pg_dump", [
    "--schema-only",
    "--no-owner",
    "--no-privileges",
    "--file",
    schemaFile,
    databaseUrl
  ]);

  const manifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    strategy: "pg_dump",
    files: {
      dump: "database.dump",
      schema: "schema.sql"
    }
  };

  await fs.writeFile(path.join(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  return {
    strategy: "pg_dump",
    path: backupDir
  };
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

async function readAllRows(supabase, tableName) {
  const rows = [];
  let from = 0;

  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(tableName).select("*").range(from, to);

    if (error) {
      if (isMissingTableError(error.message, tableName)) {
        return {
          rows: [],
          skipped: true,
          skipReason: `table ${tableName} is missing`
        };
      }
      throw new Error(`Failed to read table ${tableName}: ${error.message}`);
    }

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return { rows, skipped: false, skipReason: null };
}

async function backupWithSupabaseJson() {
  await fs.mkdir(backupDir, { recursive: true });
  const supabase = getSupabaseClient();
  const tables = await readTableList();
  const tableDir = path.join(backupDir, "tables");
  await fs.mkdir(tableDir, { recursive: true });

  const tableManifest = [];
  log(`Backing up ${tables.length} table(s) via Supabase API...`);

  for (const tableName of tables) {
    log(`Reading ${tableName}...`);
    const { rows, skipped, skipReason } = await readAllRows(supabase, tableName);
    const json = JSON.stringify(rows);
    const compressed = gzipSync(Buffer.from(json, "utf8"), { level: 9 });
    const fileName = `${tableName}.json.gz`;
    await fs.writeFile(path.join(tableDir, fileName), compressed);

    tableManifest.push({
      table: tableName,
      file: `tables/${fileName}`,
      rowCount: rows.length,
      skipped,
      skipReason
    });
  }

  const schemaSnapshotPath = path.join(backupDir, "schema.snapshot.sql");
  try {
    const schema = await fs.readFile(schemaFilePath, "utf8");
    await fs.writeFile(schemaSnapshotPath, schema, "utf8");
  } catch {
    // optional snapshot
  }

  const manifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    strategy: "supabase-json",
    pageSize,
    tables: tableManifest
  };

  await fs.writeFile(path.join(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  return {
    strategy: "supabase-json",
    path: backupDir,
    tables: tableManifest.length,
    rows: tableManifest.reduce((sum, table) => sum + table.rowCount, 0)
  };
}

async function pruneOldBackups() {
  await fs.mkdir(backupRoot, { recursive: true });
  const entries = await fs.readdir(backupRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  const old = directories.slice(keepCount);

  for (const dirName of old) {
    const target = path.join(backupRoot, dirName);
    await fs.rm(target, { recursive: true, force: true });
    log(`Removed old backup: ${target}`);
  }
}

async function main() {
  await fs.mkdir(backupRoot, { recursive: true });

  let result = null;
  const databaseUrl = getDatabaseUrl();
  const pgDumpInstalled = await hasExecutable("pg_dump");
  const canUsePgDump = Boolean(databaseUrl && pgDumpInstalled);

  if (mode === "pg_dump") {
    result = await backupWithPgDump();
  } else if (mode === "supabase-json") {
    result = await backupWithSupabaseJson();
  } else {
    result = canUsePgDump ? await backupWithPgDump() : await backupWithSupabaseJson();
  }

  await pruneOldBackups();

  log(`Backup completed with strategy: ${result.strategy}`);
  log(`Backup path: ${result.path}`);
  if (result.rows) {
    log(`Rows saved: ${result.rows}`);
  }
}

main().catch((error) => {
  console.error(`[db-backup] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

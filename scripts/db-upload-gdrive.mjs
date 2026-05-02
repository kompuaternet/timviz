#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createReadStream, existsSync, readFileSync, promises as fs } from "node:fs";
import path from "node:path";
import { google } from "googleapis";

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

function log(message) {
  console.log(`[db-upload-gdrive] ${message}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    input: "",
    keep: null,
    skipPrune: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--input") {
      parsed.input = (args[index + 1] || "").trim();
      index += 1;
      continue;
    }

    if (arg === "--keep") {
      const raw = (args[index + 1] || "").trim();
      const parsedKeep = Number.parseInt(raw, 10);
      if (Number.isFinite(parsedKeep) && parsedKeep > 0) {
        parsed.keep = parsedKeep;
      }
      index += 1;
      continue;
    }

    if (arg === "--skip-prune") {
      parsed.skipPrune = true;
    }
  }

  return parsed;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe" });

    let stdout = "";
    let stderr = "";

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

function parseServiceAccountJson(rawJson) {
  const parsed = JSON.parse(rawJson);
  if (parsed && typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

function resolveServiceAccount() {
  const inlineJson = (env.GDRIVE_SERVICE_ACCOUNT_JSON || "").trim();
  if (inlineJson) {
    return parseServiceAccountJson(inlineJson);
  }

  const base64 = (env.GDRIVE_SERVICE_ACCOUNT_BASE64 || "").trim();
  if (base64) {
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    return parseServiceAccountJson(decoded);
  }

  const filePath = (env.GDRIVE_SERVICE_ACCOUNT_FILE || "").trim();
  if (filePath) {
    const absolute = path.resolve(cwd, filePath);
    const raw = readFileSync(absolute, "utf8");
    return parseServiceAccountJson(raw);
  }

  throw new Error(
    "Google Drive credentials are missing. Set GDRIVE_SERVICE_ACCOUNT_JSON, GDRIVE_SERVICE_ACCOUNT_BASE64, or GDRIVE_SERVICE_ACCOUNT_FILE."
  );
}

function isArchiveFile(filePath) {
  return filePath.endsWith(".tar.gz") || filePath.endsWith(".tgz");
}

async function findLatestBackupDir(backupRoot) {
  const entries = await fs.readdir(backupRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  if (directories.length === 0) {
    throw new Error(`No backup directories found in ${backupRoot}`);
  }

  return path.join(backupRoot, directories[0]);
}

async function resolveInputPath(inputArg) {
  if (inputArg) {
    return path.resolve(cwd, inputArg);
  }
  const backupRoot = path.resolve(cwd, env.DB_BACKUP_DIR || "backups/db");
  return findLatestBackupDir(backupRoot);
}

async function toArchivePath(inputPath, archivePrefix) {
  const stat = await fs.stat(inputPath);

  if (stat.isFile() && isArchiveFile(inputPath)) {
    return inputPath;
  }

  if (!stat.isDirectory()) {
    throw new Error(`Unsupported input path: ${inputPath}`);
  }

  const archiveRoot = path.resolve(cwd, env.DB_BACKUP_ARCHIVE_DIR || "backups/db-archives");
  await fs.mkdir(archiveRoot, { recursive: true });

  const folderName = path.basename(inputPath);
  const archiveName = `${archivePrefix}${folderName}.tar.gz`;
  const archivePath = path.join(archiveRoot, archiveName);

  log(`Packing archive: ${archiveName}`);
  await runCommand("tar", ["-czf", archivePath, "-C", path.dirname(inputPath), folderName]);

  return archivePath;
}

function escapeDriveQueryValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function getDriveClient() {
  const credentials = resolveServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"]
  });

  const client = await auth.getClient();
  return google.drive({
    version: "v3",
    auth: client
  });
}

async function uploadBackupFile(drive, archivePath, folderId) {
  const fileName = path.basename(archivePath);

  const requestBody = {
    name: fileName
  };

  if (folderId) {
    requestBody.parents = [folderId];
  }

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody,
    media: {
      mimeType: "application/gzip",
      body: createReadStream(archivePath)
    },
    fields: "id,name,createdTime,size,webViewLink"
  });

  return response.data;
}

async function listUploadedBackups(drive, { folderId, prefix }) {
  const escapedPrefix = escapeDriveQueryValue(prefix);
  const queryParts = ["trashed = false", `name contains '${escapedPrefix}'`];

  if (folderId) {
    queryParts.push(`'${escapeDriveQueryValue(folderId)}' in parents`);
  }

  const files = [];
  let pageToken = undefined;

  do {
    const response = await drive.files.list({
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      q: queryParts.join(" and "),
      orderBy: "createdTime desc",
      pageSize: 1000,
      pageToken,
      fields: "nextPageToken, files(id,name,createdTime)"
    });

    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files.sort((a, b) => String(b.createdTime).localeCompare(String(a.createdTime)));
}

async function pruneBackups(drive, { folderId, prefix, keepCount }) {
  const files = await listUploadedBackups(drive, { folderId, prefix });
  const stale = files.slice(keepCount);

  if (stale.length === 0) {
    return;
  }

  for (const file of stale) {
    log(`Deleting old backup from Drive: ${file.name}`);
    await drive.files.delete({
      fileId: file.id,
      supportsAllDrives: true
    });
  }
}

async function main() {
  const args = parseArgs();
  const folderId = (env.GDRIVE_FOLDER_ID || "").trim();
  const archivePrefix = (env.GDRIVE_BACKUP_PREFIX || "timviz-db-backup-").trim();
  const keepCount =
    args.keep ??
    Math.max(
      1,
      Number.parseInt(env.GDRIVE_BACKUP_KEEP || env.DB_BACKUP_KEEP || "30", 10) || 30
    );

  if (!folderId) {
    throw new Error("GDRIVE_FOLDER_ID is required (share that folder with your service account email).");
  }

  const inputPath = await resolveInputPath(args.input);
  const archivePath = await toArchivePath(inputPath, archivePrefix);
  const drive = await getDriveClient();
  const uploaded = await uploadBackupFile(drive, archivePath, folderId);

  log(`Uploaded: ${uploaded.name}`);
  log(`Drive file id: ${uploaded.id}`);

  if (!args.skipPrune) {
    await pruneBackups(drive, { folderId, prefix: archivePrefix, keepCount });
    log(`Retention applied on Drive: keep last ${keepCount}`);
  }
}

main().catch((error) => {
  console.error(`[db-upload-gdrive] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});


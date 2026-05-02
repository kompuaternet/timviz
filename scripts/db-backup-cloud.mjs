#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
  console.log(`[db-backup-cloud] ${message}`);
}

function runNodeScript(scriptRelativePath, args = []) {
  const scriptPath = path.join(cwd, scriptRelativePath);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: "inherit",
      env
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${scriptRelativePath} failed with code ${code}`));
    });
  });
}

function hasGoogleDriveSetup() {
  const hasCreds =
    Boolean((env.GDRIVE_SERVICE_ACCOUNT_JSON || "").trim()) ||
    Boolean((env.GDRIVE_SERVICE_ACCOUNT_BASE64 || "").trim()) ||
    Boolean((env.GDRIVE_SERVICE_ACCOUNT_FILE || "").trim());
  const hasFolder = Boolean((env.GDRIVE_FOLDER_ID || "").trim());
  return hasCreds && hasFolder;
}

function isUploadEnabled() {
  const raw = (env.DB_BACKUP_CLOUD_UPLOAD || "auto").trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no" || raw === "off") {
    return false;
  }
  if (raw === "1" || raw === "true" || raw === "yes" || raw === "on") {
    return true;
  }
  return hasGoogleDriveSetup();
}

async function main() {
  log("Starting backup...");
  await runNodeScript("scripts/db-backup.mjs");
  log("Backup finished.");

  if (!isUploadEnabled()) {
    log("Cloud upload is disabled (DB_BACKUP_CLOUD_UPLOAD=off).");
    return;
  }

  if (!hasGoogleDriveSetup()) {
    log("Google Drive secrets are not set, skipping upload.");
    return;
  }

  log("Uploading latest backup to Google Drive...");
  await runNodeScript("scripts/db-upload-gdrive.mjs");
  log("Cloud upload finished.");
}

main().catch((error) => {
  console.error(`[db-backup-cloud] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});


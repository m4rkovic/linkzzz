import "server-only";

import { access, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { getJsonDatabaseDirectory, getJsonDatabaseFile, getJsonSeedFile } from "@/server/persistence/json/paths";

export const JSON_DATABASE_FILES = [
  "users.json",
  "credentials.json",
  "subscriptions.json",
  "sessions.json",
  "audit-log.json",
  "profiles.json",
] as const;

async function fileExists(filePath: string) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureJsonDatabaseInitialized() {
  await mkdir(getJsonDatabaseDirectory(), { recursive: true });

  for (const fileName of JSON_DATABASE_FILES) {
    const destination = getJsonDatabaseFile(fileName);

    if (await fileExists(destination)) {
      continue;
    }

    await copyFile(getJsonSeedFile(fileName), destination);
  }
}

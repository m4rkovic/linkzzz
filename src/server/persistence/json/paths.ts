import "server-only";

import path from "node:path";

export const JSON_DB_DIRECTORY_ENV = "LINKZZZ_JSON_DB_DIR";

export function getJsonDatabaseDirectory() {
  const configured = process.env[JSON_DB_DIRECTORY_ENV]?.trim();

  if (configured) {
    return path.resolve(configured);
  }

  return path.join(process.cwd(), ".linkzzz-data");
}

export function getJsonSeedDirectory() {
  return path.join(process.cwd(), "mock-db", "seed");
}

export function getJsonDatabaseFile(fileName: string) {
  return path.join(getJsonDatabaseDirectory(), fileName);
}

export function getJsonSeedFile(fileName: string) {
  return path.join(getJsonSeedDirectory(), fileName);
}

import "server-only";

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getJsonFileLock } from "@/server/persistence/json/json-lock";

export class JsonStoreError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "JsonStoreError";
  }
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new JsonStoreError(`Failed to read JSON store: ${filePath}`, error);
  }
}

async function writeJsonFile<T>(filePath: string, value: T): Promise<void> {
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");

    try {
      await rename(temporaryPath, filePath);
    } catch (error) {
      const code = error instanceof Error && "code" in error
        ? String(error.code)
        : "";

      if (code !== "EEXIST" && code !== "EPERM") {
        throw error;
      }

      await rm(filePath, { force: true });
      await rename(temporaryPath, filePath);
    }
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw new JsonStoreError(`Failed to write JSON store: ${filePath}`, error);
  }
}

export class JsonArrayStore<T> {
  private readonly lock;

  constructor(readonly filePath: string) {
    this.lock = getJsonFileLock(filePath);
  }

  async read(): Promise<T[]> {
    return this.lock.run(async () => readJsonFile<T[]>(this.filePath));
  }

  async replace(items: T[]): Promise<void> {
    await this.lock.run(async () => writeJsonFile(this.filePath, items));
  }

  async mutate<TResult>(
    mutation: (items: T[]) => TResult | Promise<TResult>,
  ): Promise<TResult> {
    return this.lock.run(async () => {
      const items = await readJsonFile<T[]>(this.filePath);
      const result = await mutation(items);
      await writeJsonFile(this.filePath, items);
      return result;
    });
  }
}

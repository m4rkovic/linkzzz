import "server-only";

import type { PasswordCredentialRepository } from "@/server/services/contracts";
import { JsonArrayStore } from "@/server/persistence/json/json-store";
import { getJsonDatabaseFile } from "@/server/persistence/json/paths";
import type { StoredPasswordCredential } from "@/server/persistence/json/types";

export class JsonPasswordCredentialRepository
  implements PasswordCredentialRepository
{
  private readonly store = new JsonArrayStore<StoredPasswordCredential>(
    getJsonDatabaseFile("credentials.json"),
  );

  async getPasswordHash(userId: string): Promise<string | null> {
    const credentials = await this.store.read();
    return credentials.find((credential) => credential.userId === userId)
      ?.passwordHash ?? null;
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.store.mutate((credentials) => {
      const existing = credentials.find(
        (credential) => credential.userId === userId,
      );

      if (existing) {
        existing.passwordHash = passwordHash;
        existing.updatedAt = new Date().toISOString();
        return;
      }

      credentials.push({
        userId,
        passwordHash,
        mustChangePassword: true,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async getMustChangePassword(userId: string): Promise<boolean> {
    const credentials = await this.store.read();
    return credentials.find((credential) => credential.userId === userId)
      ?.mustChangePassword ?? false;
  }

  async setMustChangePassword(userId: string, value: boolean): Promise<void> {
    await this.store.mutate((credentials) => {
      const credential = credentials.find(
        (candidate) => candidate.userId === userId,
      );

      if (!credential) {
        throw new Error("Password credential does not exist.");
      }

      credential.mustChangePassword = value;
      credential.updatedAt = new Date().toISOString();
    });
  }
}

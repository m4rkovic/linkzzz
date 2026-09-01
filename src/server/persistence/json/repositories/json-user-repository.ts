import "server-only";

import { randomUUID } from "node:crypto";
import type { UserRecord, UserRepository } from "@/server/services/contracts";
import { JsonArrayStore } from "@/server/persistence/json/json-store";
import { getJsonDatabaseFile } from "@/server/persistence/json/paths";
import type { StoredUser } from "@/server/persistence/json/types";
import type { AccountStatus, UserRole } from "@/server/types/auth";

function toUserRecord(user: StoredUser): UserRecord {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
  };
}

export class JsonUserRepository implements UserRepository {
  private readonly store = new JsonArrayStore<StoredUser>(
    getJsonDatabaseFile("users.json"),
  );

  async findById(id: string): Promise<UserRecord | null> {
    const users = await this.store.read();
    const user = users.find((candidate) => candidate.id === id);
    return user ? toUserRecord(user) : null;
  }

  async findByLogin(login: string): Promise<UserRecord | null> {
    const normalized = login.trim().toLowerCase();
    const users = await this.store.read();
    const user = users.find(
      (candidate) =>
        candidate.username.toLowerCase() === normalized ||
        candidate.email.toLowerCase() === normalized,
    );

    return user ? toUserRecord(user) : null;
  }

  async list(): Promise<UserRecord[]> {
    const users = await this.store.read();
    return users.map(toUserRecord);
  }

  async create(input: {
    username: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
  }): Promise<UserRecord> {
    return this.store.mutate((users) => {
      const username = input.username.trim().toLowerCase();
      const email = input.email.trim().toLowerCase();

      if (
        users.some(
          (user) =>
            user.username.toLowerCase() === username ||
            user.email.toLowerCase() === email,
        )
      ) {
        throw new Error("User with the same username or email already exists.");
      }

      const now = new Date().toISOString();
      const user: StoredUser = {
        id: randomUUID(),
        username,
        email,
        role: input.role,
        accountStatus: input.accountStatus,
        createdAt: now,
        updatedAt: now,
      };

      users.push(user);
      return toUserRecord(user);
    });
  }

  async update(
    id: string,
    patch: Partial<Pick<UserRecord, "username" | "email" | "role" | "accountStatus">>,
  ): Promise<UserRecord | null> {
    return this.store.mutate((users) => {
      const user = users.find((candidate) => candidate.id === id);

      if (!user) {
        return null;
      }

      if (patch.username !== undefined) {
        const username = patch.username.trim().toLowerCase();
        const duplicate = users.some(
          (candidate) =>
            candidate.id !== id && candidate.username.toLowerCase() === username,
        );

        if (duplicate) {
          throw new Error("Username already exists.");
        }

        user.username = username;
      }

      if (patch.email !== undefined) {
        const email = patch.email.trim().toLowerCase();
        const duplicate = users.some(
          (candidate) =>
            candidate.id !== id && candidate.email.toLowerCase() === email,
        );

        if (duplicate) {
          throw new Error("Email already exists.");
        }

        user.email = email;
      }

      if (patch.role !== undefined) {
        user.role = patch.role;
      }

      if (patch.accountStatus !== undefined) {
        user.accountStatus = patch.accountStatus;
      }

      user.updatedAt = new Date().toISOString();
      return toUserRecord(user);
    });
  }
}

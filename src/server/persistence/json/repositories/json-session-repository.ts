import "server-only";

import { randomUUID } from "node:crypto";
import type { SessionRepository } from "@/server/services/contracts";
import { JsonArrayStore } from "@/server/persistence/json/json-store";
import { getJsonDatabaseFile } from "@/server/persistence/json/paths";
import type { StoredSession } from "@/server/persistence/json/types";

export class JsonSessionRepository implements SessionRepository {
  private readonly store = new JsonArrayStore<StoredSession>(
    getJsonDatabaseFile("sessions.json"),
  );

  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ id: string }> {
    return this.store.mutate((sessions) => {
      const session: StoredSession = {
        id: randomUUID(),
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt.toISOString(),
        revokedAt: null,
        createdAt: new Date().toISOString(),
      };

      sessions.push(session);
      return { id: session.id };
    });
  }

  async findValidByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<{ id: string; userId: string; expiresAt: Date } | null> {
    const sessions = await this.store.read();
    const session = sessions.find(
      (candidate) =>
        candidate.tokenHash === tokenHash &&
        candidate.revokedAt === null &&
        new Date(candidate.expiresAt).getTime() > now.getTime(),
    );

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      expiresAt: new Date(session.expiresAt),
    };
  }

  async revokeById(id: string): Promise<void> {
    await this.store.mutate((sessions) => {
      const session = sessions.find((candidate) => candidate.id === id);

      if (session && session.revokedAt === null) {
        session.revokedAt = new Date().toISOString();
      }
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.store.mutate((sessions) => {
      const now = new Date().toISOString();

      for (const session of sessions) {
        if (session.userId === userId && session.revokedAt === null) {
          session.revokedAt = now;
        }
      }
    });
  }

  async deleteExpired(now: Date): Promise<number> {
    return this.store.mutate((sessions) => {
      const before = sessions.length;
      const active = sessions.filter(
        (session) => new Date(session.expiresAt).getTime() > now.getTime(),
      );

      sessions.splice(0, sessions.length, ...active);
      return before - active.length;
    });
  }
}

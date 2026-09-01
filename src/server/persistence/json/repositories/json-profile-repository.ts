import "server-only";

import type { ProfileRepository } from "@/server/services/contracts";
import { JsonArrayStore } from "@/server/persistence/json/json-store";
import { getJsonDatabaseFile } from "@/server/persistence/json/paths";
import type { StoredProfile } from "@/server/persistence/json/types";
import type { PersistedProfileData } from "@/types/persisted-profile";

function cloneProfile(profile: PersistedProfileData): PersistedProfileData {
  return structuredClone(profile);
}

export class JsonProfileRepository implements ProfileRepository {
  private readonly store = new JsonArrayStore<StoredProfile>(
    getJsonDatabaseFile("profiles.json"),
  );

  async findByUserId(userId: string): Promise<PersistedProfileData | null> {
    return (await this.findVersionedByUserId(userId))?.profile ?? null;
  }

  async findVersionedByUserId(userId: string) {
    const profiles = await this.store.read();
    const record = profiles.find((candidate) => candidate.userId === userId);
    return record
      ? {
          profile: cloneProfile(record.profile),
          revision: record.revision ?? 1,
        }
      : null;
  }

  async findBySlug(
    slug: string,
  ): Promise<{ userId: string; profile: PersistedProfileData } | null> {
    const normalized = slug.trim().toLowerCase();
    const profiles = await this.store.read();
    const record = profiles.find(
      (candidate) => candidate.profile.slug.toLowerCase() === normalized,
    );

    return record
      ? { userId: record.userId, profile: cloneProfile(record.profile) }
      : null;
  }

  async upsert(
    userId: string,
    profile: PersistedProfileData,
  ): Promise<PersistedProfileData> {
    return this.store.mutate((profiles) => {
      const duplicateSlug = profiles.some(
        (candidate) =>
          candidate.userId !== userId &&
          candidate.profile.slug.toLowerCase() === profile.slug.toLowerCase(),
      );

      if (duplicateSlug) {
        throw new Error("Profile slug already exists.");
      }

      const now = new Date().toISOString();
      const existing = profiles.find((candidate) => candidate.userId === userId);
      const cloned = cloneProfile(profile);

      if (existing) {
        existing.profile = cloned;
        existing.revision = (existing.revision ?? 1) + 1;
        existing.updatedAt = now;
      } else {
        profiles.push({
          userId,
          profile: cloned,
          revision: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      return cloneProfile(cloned);
    });
  }

  async updateIfRevision(
    userId: string,
    profile: PersistedProfileData,
    expectedRevision: number,
  ) {
    return this.store.mutate((profiles) => {
      const existing = profiles.find((candidate) => candidate.userId === userId);
      if (!existing || (existing.revision ?? 1) !== expectedRevision) {
        return { ok: false as const, reason: "REVISION_CONFLICT" as const };
      }

      const duplicateSlug = profiles.some(
        (candidate) =>
          candidate.userId !== userId &&
          candidate.profile.slug.toLowerCase() === profile.slug.toLowerCase(),
      );
      if (duplicateSlug) {
        throw new Error("Profile slug already exists.");
      }

      const revision = expectedRevision + 1;
      existing.profile = cloneProfile(profile);
      existing.revision = revision;
      existing.updatedAt = new Date().toISOString();

      return {
        ok: true as const,
        profile: cloneProfile(existing.profile),
        revision,
      };
    });
  }
}

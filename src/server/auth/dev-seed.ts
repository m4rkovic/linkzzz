import "server-only";

import { passwordHasher } from "@/server/auth/password-hasher";
import { getServerDependencies } from "@/server/persistence/dependencies";

export const DEVELOPMENT_LOGIN_CREDENTIALS = {
  admin: {
    identifier: "admin",
    password: "LinkzzzAdmin!2026",
  },
  customer: {
    identifier: "skyhook",
    password: "LinkzzzSky!2026",
  },
} as const;

let seedPromise: Promise<void> | null = null;

export function ensureDevelopmentAuthSeeded() {
  if (process.env.NODE_ENV === "production") {
    return Promise.resolve();
  }

  if (!seedPromise) {
    seedPromise = seedDevelopmentAuth();
  }

  return seedPromise;
}

async function seedDevelopmentAuth() {
  const dependencies = await getServerDependencies();

  for (const credentials of Object.values(DEVELOPMENT_LOGIN_CREDENTIALS)) {
    const user = await dependencies.users.findByLogin(credentials.identifier);

    if (!user) {
      continue;
    }

    const existingHash = await dependencies.passwords.getPasswordHash(user.id);

    if (existingHash) {
      continue;
    }

    const passwordHash = await passwordHasher.hash(credentials.password);
    await dependencies.passwords.setPasswordHash(user.id, passwordHash);
    await dependencies.passwords.setMustChangePassword(user.id, false);
  }
}

import "dotenv/config";

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { Client } from "pg";

import {
  createE2EServerEnvironment,
  requireIsolatedE2EDatabaseUrl,
} from "../e2e/environment";

const require = createRequire(resolve("package.json"));

async function main() {
  const e2eDatabaseUrl = requireIsolatedE2EDatabaseUrl();
  const environment = createE2EServerEnvironment();

  await run(process.execPath, [
    require.resolve("prisma/build/index.js"),
    "migrate",
    "deploy",
  ], environment);

  await run(process.execPath, [
    "--import",
    "tsx",
    resolve("prisma/seed.ts"),
  ], environment);

  await removeAbandonedTestCustomers(e2eDatabaseUrl);
  await resetSeedCustomerTestState(e2eDatabaseUrl);

  const server = spawn(
    process.execPath,
    [resolve("scripts/dev-server.mjs"), ...process.argv.slice(2)],
    { env: environment, stdio: "inherit" },
  );

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => server.kill(signal));
  }

  server.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exitCode = code ?? 1;
  });

  server.on("error", (error) => {
    console.error("Unable to start the E2E development server.", error);
    process.exitCode = 1;
  });
}

main().catch((error) => {
  console.error("Unable to prepare the E2E environment.", error);
  process.exitCode = 1;
});

async function run(
  command: string,
  arguments_: string[],
  childEnvironment: NodeJS.ProcessEnv,
) {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, arguments_, {
      env: childEnvironment,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`E2E setup command failed (${signal ?? code ?? "unknown"}).`));
    });
  });
}

async function removeAbandonedTestCustomers(connectionString: string) {
  const database = new Client({ connectionString });
  try {
    await database.connect();
    await database.query("BEGIN");
    await database.query(
      `DELETE FROM "AuditLog"
       WHERE "actorUserId" IN (
         SELECT "id" FROM "User"
         WHERE "role" = 'CUSTOMER' AND LEFT("username", 4) = 'e2e_'
       ) OR "targetUserId" IN (
         SELECT "id" FROM "User"
         WHERE "role" = 'CUSTOMER' AND LEFT("username", 4) = 'e2e_'
       )`,
    );
    await database.query(
      `DELETE FROM "User"
       WHERE "role" = 'CUSTOMER' AND LEFT("username", 4) = 'e2e_'`,
    );
    await database.query("COMMIT");
  } catch (error) {
    await database.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await database.end();
  }
}

async function resetSeedCustomerTestState(connectionString: string) {
  const database = new Client({ connectionString });
  try {
    await database.connect();
    await database.query("BEGIN");

    // The seeded skyhook account is shared by read-only E2E and visual tests.
    // Normalize mutable analytics/timestamps so screenshot baselines do not
    // depend on previous test runs or the day the seed command was executed.
    await database.query(
      `DELETE FROM "AnalyticsEvent"
       WHERE "smartLinkId" IN (
         SELECT link."id"
         FROM "SmartLink" AS link
         INNER JOIN "User" AS owner ON owner."id" = link."userId"
         WHERE owner."username" = 'skyhook'
       )`,
    );

    await database.query(
      `UPDATE "SmartLink"
       SET "updatedAt" = CASE "slug"
         WHEN 'skyhook-listen' THEN TIMESTAMPTZ '2026-09-03 12:00:00+00'
         WHEN 'skyhook' THEN TIMESTAMPTZ '2026-09-03 11:00:00+00'
         ELSE "updatedAt"
       END
       WHERE "slug" IN ('skyhook', 'skyhook-listen')`,
    );

    await database.query(
      `INSERT INTO "AnalyticsEvent" (
         "id", "smartLinkId", "type", "isBot", "createdAt"
       )
       SELECT 'e2e-visual-skyhook-view-1', link."id", 'SMART_LINK_VIEW'::"AnalyticsEventType", false,
              TIMESTAMPTZ '2026-09-03 10:00:00+00'
       FROM "SmartLink" AS link
       WHERE link."slug" = 'skyhook'
       UNION ALL
       SELECT 'e2e-visual-skyhook-view-2', link."id", 'SMART_LINK_VIEW'::"AnalyticsEventType", false,
              TIMESTAMPTZ '2026-09-03 10:05:00+00'
       FROM "SmartLink" AS link
       WHERE link."slug" = 'skyhook'`,
    );

    await database.query("COMMIT");
  } catch (error) {
    await database.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await database.end();
  }
}

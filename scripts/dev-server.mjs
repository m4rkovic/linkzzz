import "dotenv/config";

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { Client } from "pg";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const forwardedArguments = process.argv.slice(2);
const server = spawn(process.execPath, [nextCli, "dev", ...forwardedArguments], {
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

let prewarmStarted = false;
server.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  const output = stripAnsi(String(chunk));
  if (!prewarmStarted && /Ready in|Local:/.test(output)) {
    prewarmStarted = true;
    void prewarmCoreRoutes();
  }
});
server.stderr.on("data", (chunk) => process.stderr.write(chunk));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});

server.on("error", (error) => {
  console.error("Unable to start the Next.js development server.", error);
  process.exitCode = 1;
});

async function prewarmCoreRoutes() {
  if (process.env.LINKZZZ_DEV_PREWARM === "0") return;

  const origin = resolveOrigin(forwardedArguments);
  const publicRoutes = [
    "/",
    "/login",
    "/change-password",
  ];
  const protectedRoutes = [
    "/dashboard",
    "/dashboard/links",
    "/dashboard/links/linkzzz-dev-prewarm",
    "/dashboard/profile",
    "/dashboard/appearance",
    "/dashboard/analytics",
    "/dashboard/analytics/linkzzz-dev-prewarm",
    "/dashboard/plans",
    "/dashboard/account",
    "/admin",
    "/admin/users",
    "/admin/users/new",
    "/admin/users/linkzzz-dev-prewarm",
  ];
  const databaseAvailable = await canReachDatabase();
  const routes = databaseAvailable
    ? [...publicRoutes, ...protectedRoutes]
    : publicRoutes;

  let completed = 0;
  for (let index = 0; index < routes.length; index += 3) {
    const batch = routes.slice(index, index + 3);
    await Promise.allSettled(
      batch.map(async (route) => {
        await fetch(`${origin}${route}`, {
          redirect: "manual",
          signal: AbortSignal.timeout(30_000),
        });
        completed += 1;
      }),
    );
  }

  console.log(`[Linkzzz] Prewarmed ${completed}/${routes.length} core development routes.`);
  if (!databaseAvailable) {
    console.warn("[Linkzzz] Database is unavailable; protected route prewarm was skipped.");
  }
}

async function canReachDatabase() {
  const configured = process.env.DATABASE_URL?.trim();
  if (!configured) return false;

  let database;
  try {
    database = new Client({
      connectionString: normalizeLegacyStrictSsl(configured),
      connectionTimeoutMillis: 2_000,
    });
    await database.connect();
    await database.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await database?.end().catch(() => undefined);
  }
}

function normalizeLegacyStrictSsl(value) {
  const parsed = new URL(value);
  const sslMode = parsed.searchParams.get("sslmode")?.trim().toLowerCase();
  if (["prefer", "require", "verify-ca"].includes(sslMode)) {
    parsed.searchParams.set("sslmode", "verify-full");
    return parsed.toString();
  }
  return value;
}

function resolveOrigin(arguments_) {
  const hostname = optionValue(arguments_, ["--hostname", "-H"]) ?? "127.0.0.1";
  const port = optionValue(arguments_, ["--port", "-p"]) ?? "3000";
  const requestHost = hostname === "0.0.0.0" || hostname === "::" ? "127.0.0.1" : hostname;
  return `http://${requestHost}:${port}`;
}

function optionValue(arguments_, names) {
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    const inlineName = names.find((name) => argument.startsWith(`${name}=`));
    if (inlineName) return argument.slice(inlineName.length + 1);
    if (names.includes(argument)) return arguments_[index + 1];
  }
  return undefined;
}

function stripAnsi(value) {
  return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
}

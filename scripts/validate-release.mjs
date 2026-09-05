import { spawnSync } from "node:child_process";

const includeE2E = process.argv.includes("--e2e");

const steps = [
  ["Prisma generate", ["run", "prisma:generate"]],
  ["Unit tests", ["test"]],
  ["TypeScript", ["run", "typecheck"]],
  ["ESLint", ["run", "lint"]],
  ["Production build", ["run", "build"]],
];

if (includeE2E) {
  steps.push([
    "Functional Playwright",
    ["run", "test:e2e:functional", "--", "--workers=1"],
  ]);
}

for (const [label, arguments_] of steps) {
  console.log(`\n[Linkzzz validation] ${label}`);
  const result = runNpm(arguments_);

  if (result.error) {
    console.error(`[Linkzzz validation] Unable to start ${label}.`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\n[Linkzzz validation] FAILED at: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\n[Linkzzz validation] PASS (${includeE2E ? "full" : "core"} gate).`);

function runNpm(arguments_) {
  const environment = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
  };

  // npm exposes the absolute npm CLI path to lifecycle scripts. Running that
  // JavaScript entry through the current Node executable avoids Windows'
  // spawnSync EINVAL behavior for .cmd shims while keeping the runner portable.
  const npmExecPath = process.env.npm_execpath?.trim();
  if (npmExecPath) {
    return spawnSync(process.execPath, [npmExecPath, ...arguments_], {
      stdio: "inherit",
      env: environment,
    });
  }

  // Fallback for direct `node scripts/validate-release.mjs` execution, where
  // npm lifecycle variables are not guaranteed to exist.
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  return spawnSync(npmCommand, arguments_, {
    stdio: "inherit",
    env: environment,
    shell: process.platform === "win32",
  });
}

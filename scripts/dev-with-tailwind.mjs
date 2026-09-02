import { spawn, spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const shell = isWindows;
const extraNextArgs = process.argv.slice(2);

function run(command, args, options = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell,
    ...options,
  });
}

function runSync(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const npx = isWindows ? "npx.cmd" : "npx";

// Build once before Next starts so the very first request is fully styled.
runSync(npx, [
  "tailwindcss",
  "-i",
  "./src/styles/tailwind.input.css",
  "-o",
  "./src/app/tailwind.generated.css",
]);

const tailwind = run(npx, [
  "tailwindcss",
  "-i",
  "./src/styles/tailwind.input.css",
  "-o",
  "./src/app/tailwind.generated.css",
  "--watch",
]);

const next = run(npx, ["next", "dev"]);

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  tailwind.kill();
  next.kill();
  setTimeout(() => process.exit(exitCode), 50).unref();
}

next.on("exit", (code) => stop(code ?? 0));
tailwind.on("exit", (code) => {
  if (!stopping && code && code !== 0) stop(code);
});

process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const criticalFlowPath = resolve(process.cwd(), "e2e/critical-flow.spec.ts");

let source;
try {
  source = await readFile(criticalFlowPath, "utf8");
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    console.log("No e2e/critical-flow.spec.ts found. Nothing to repair.");
    process.exit(0);
  }
  throw error;
}

if (source.includes("E2E API login failed")) {
  console.log("critical-flow.spec.ts already uses API-backed authentication.");
  process.exit(0);
}

const loginHelperPattern = /async function login\(\s*page:\s*Page,\s*identifier:\s*string,\s*password:\s*string,\s*\)\s*\{[\s\S]*?\r?\n\}/m;

const replacement = `async function login(page: Page, identifier: string, password: string) {
  const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
  const origin = new URL(baseURL).origin;
  const response = await page.request.post(\`${"${origin}"}/api/auth/login\`, {
    headers: { origin },
    data: {
      identifier,
      password,
      rememberMe: true,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    role?: "CUSTOMER" | "ADMIN";
    mustChangePassword?: boolean;
    error?: string;
  };

  if (!response.ok() || !payload.ok || !payload.role) {
    throw new Error(
      \`E2E API login failed (${"${response.status()}"}): ${"${payload.error ?? \"Unknown login error.\"}"}\`,
    );
  }

  const destination = payload.mustChangePassword
    ? "/change-password"
    : payload.role === "ADMIN"
      ? "/admin"
      : "/dashboard";

  await page.goto(destination, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(
    payload.mustChangePassword
      ? /\\/change-password(?:\\/|$)/
      : payload.role === "ADMIN"
        ? /\\/admin(?:\\/|$)/
        : /\\/dashboard(?:\\/|$)/,
  );
}`;

if (!loginHelperPattern.test(source)) {
  console.error("Could not find the legacy critical-flow login helper. No file was changed.");
  process.exit(1);
}

source = source.replace(loginHelperPattern, replacement);
await writeFile(criticalFlowPath, source, "utf8");
console.log("Updated e2e/critical-flow.spec.ts: API-backed authentication helper.");

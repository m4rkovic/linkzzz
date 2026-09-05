import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const API_ROOT = path.resolve(process.cwd(), "src", "app", "api");

// Route handlers may intentionally catch malformed input, authorization failures,
// quota conflicts and other expected 4xx cases without emitting error logs.
// What must never happen is swallowing an unexpected exception into a local 5xx
// response without either logging it or rethrowing it to Next's onRequestError hook.
test("caught API 5xx responses are observable", async () => {
  const routeFiles = await collectRouteFiles(API_ROOT);
  const violations: string[] = [];

  for (const filePath of routeFiles) {
    const sourceText = await readFile(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    walk(sourceFile, (node) => {
      if (!ts.isCatchClause(node)) return;

      const catchText = node.getText(sourceFile);
      if (!containsFiveHundredStatus(node.block)) return;

      const observable =
        catchText.includes("logServerError(") ||
        node.block.statements.some((statement) => ts.isThrowStatement(statement));

      if (!observable) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        violations.push(`${path.relative(process.cwd(), filePath)}:${line}`);
      }
    });
  }

  assert.deepEqual(
    violations,
    [],
    `Caught 5xx responses must log with logServerError() or rethrow. Violations:\n${violations.join("\n")}`,
  );
});

function containsFiveHundredStatus(block: ts.Block) {
  let found = false;
  walk(block, (node) => {
    if (found || !ts.isPropertyAssignment(node)) return;
    const name = node.name.getText();
    if (name !== "status" && name !== '"status"' && name !== "'status'") return;
    if (ts.isNumericLiteral(node.initializer) && node.initializer.text === "500") {
      found = true;
    }
  });
  return found;
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

async function collectRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectRouteFiles(target);
      return entry.isFile() && entry.name === "route.ts" ? [target] : [];
    }),
  );
  return files.flat();
}

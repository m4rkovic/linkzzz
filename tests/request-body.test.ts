import assert from "node:assert/strict";
import test from "node:test";

import { readJsonBodyWithLimit } from "@/server/security/request-body";

test("bounded JSON reader parses a valid body", async () => {
  const request = new Request("http://localhost/api/test", {
    method: "POST",
    body: JSON.stringify({ ok: true }),
  });

  const result = await readJsonBodyWithLimit(request, 4_096);
  assert.deepEqual(result, { ok: true, value: { ok: true } });
});

test("bounded JSON reader rejects a streamed body that exceeds the byte limit without content-length", async () => {
  const encoder = new TextEncoder();
  const oversized = encoder.encode(`{"value":"${"x".repeat(4_096)}"}`);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(oversized.subarray(0, 2_048));
      controller.enqueue(oversized.subarray(2_048));
      controller.close();
    },
  });
  const request = new Request("http://localhost/api/test", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  assert.equal(request.headers.get("content-length"), null);
  const result = await readJsonBodyWithLimit(request, 4_096);
  assert.deepEqual(result, { ok: false, reason: "TOO_LARGE" });
});

test("bounded JSON reader distinguishes malformed JSON from an oversized payload", async () => {
  const request = new Request("http://localhost/api/test", {
    method: "POST",
    body: "{not-json",
  });

  const result = await readJsonBodyWithLimit(request, 4_096);
  assert.deepEqual(result, { ok: false, reason: "INVALID_JSON" });
});

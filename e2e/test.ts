import { expect, test as base } from "@playwright/test";

export { expect };

export const test = base.extend<{ e2eClientIp: void }>({
  e2eClientIp: [
    async ({ page }, use, testInfo) => {
      await page.context().setExtraHTTPHeaders({
        "x-forwarded-for": deterministicTestIp(
          `${testInfo.project.name}:${testInfo.workerIndex}:${testInfo.retry}:${testInfo.titlePath.join(":")}`,
        ),
      });
      await use();
    },
    { auto: true },
  ],
});

function deterministicTestIp(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  const positive = hash >>> 0;
  const third = 1 + ((positive >>> 8) % 254);
  const fourth = 1 + (positive % 254);
  return `198.18.${third}.${fourth}`;
}

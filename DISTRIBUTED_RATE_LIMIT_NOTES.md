# Distributed rate-limit patch

This patch replaces process-local production counters with an atomic, shared
Upstash Redis rate limiter. Raw IP addresses, usernames, and emails are hashed
before they are used as Redis identifiers.

## Local development

No Redis account is required. Leave `RATE_LIMIT_BACKEND` unset or set it to
`memory`.

## Production

Create an Upstash Redis database and configure these server-only environment
variables in the deployment environment:

```env
RATE_LIMIT_BACKEND=upstash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
RATE_LIMIT_REDIS_TIMEOUT_MS=2000
```

The application does not silently fall back to process memory in production.
If configuration is missing or Redis is unavailable, protected endpoints fail
closed with HTTP 503 instead of accepting unprotected requests.

## Apply and verify

```powershell
npm.cmd install
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

No Prisma migration is required for this patch.

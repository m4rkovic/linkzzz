# Linkzzz

Linkzzz is a Next.js 16 SaaS application with a Prisma 7/PostgreSQL backend,
server-side sessions, subscription-aware access control, profile editing,
analytics, geo routing, custom domains, and S3-compatible asset storage.

## Local development

Copy `.env.example` to `.env`, keep a local PostgreSQL `DATABASE_URL`, then run:

```powershell
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npm.cmd run dev
```

Development defaults to the in-memory rate limiter and local asset storage.
Application data always uses PostgreSQL.

## Verification

```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

The browser E2E suite needs the seeded development database and Chromium:

```powershell
npm.cmd run test:e2e:install
npm.cmd run test:e2e
```

The critical E2E test provisions a uniquely named temporary customer through
the admin UI, completes the forced password change, creates a link, publishes a
profile, verifies the public analytics request, and removes that test customer.

## Production readiness

Production uses PostgreSQL, Upstash, and S3-compatible object storage. Fill all
production values shown in `.env.example`, then validate their shape without
printing secrets:

```powershell
npm.cmd run env:check
```

See `PRODUCTION_READINESS_NOTES.md` for the complete deployment order.

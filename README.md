# Linkzzz

Linkzzz is a Next.js 16 SaaS application with a Prisma 7/PostgreSQL backend,
server-side sessions, subscription-aware access control, SmartLinks, landing
page editing, analytics, geo routing, custom domains, and S3-compatible asset
storage.

## SmartLink foundation

- A customer owns multiple top-level SmartLinks.
- PREMIUM allows 2 SmartLinks; PREMIUM_PLUS allows 10.
- A `LANDING_PAGE` SmartLink owns one optional `Page` content record.
- Existing link cards are represented by the physical Prisma/PostgreSQL
  `PageCard` model. There are no legacy `Profile` or `Link` table aliases.
- Page-card limits remain 40/100 and are independent from SmartLink limits.

## Local development

Copy `.env.example` to `.env`, keep a local PostgreSQL `DATABASE_URL`, then run:

If you are replacing a pre-SmartLink development copy, do not extract this
archive over the old project directory. The migration history was intentionally
squashed, and archive extraction does not remove migration files that no longer
exist. Either extract into a new empty directory, or remove the stale migration
directories before continuing:

```powershell
Remove-Item .\prisma\migrations\20260901102240_init -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\prisma\migrations\20260901190000_asset_references -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\prisma\migrations\20260902110000_profile_revision -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\prisma\migrations\20260902150000_smart_links_foundation -Recurse -Force -ErrorAction SilentlyContinue
```

`prisma/migrations` must then contain only
`20260902180000_clean_smartlink_init` and `migration_lock.toml`.

Run the database commands one at a time and stop if any command fails:

```powershell
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate reset --force
npx.cmd prisma db seed
npm.cmd run dev
```

The reset is intentionally destructive for the development database because
the schema was cleaned and the migration history was squashed before launch.

The development seed creates a populated `skyhook` landing page and a draft
`skyhook-listen` Direct SmartLink. Seeded login credentials are documented in
`PRISMA_POSTGRES_MIGRATION_NOTES.md`.

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

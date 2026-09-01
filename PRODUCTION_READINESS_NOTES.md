# Linkzzz production readiness patch

This patch makes Prisma/PostgreSQL the only application runtime persistence
path, adds a production environment validator, introduces the critical
Playwright E2E flow, and centralizes runtime user-upload image rendering.

## What changed

- The service/repository abstraction remains unchanged.
- `getServerDependencies()` now resolves only Prisma repositories.
- Legacy JSON adapter source remains in the repository but is unreachable from
  the application runtime, so it is not traced into the production build.
- Production configuration can be checked with `npm.cmd run env:check`.
- Playwright covers admin provisioning, forced password change, link creation,
  profile publishing, public rendering, and PAGE_VIEW analytics.
- Prisma media metadata now normalizes stored `null` values before returning a
  profile, fixing saves for newly provisioned customers without uploaded media.
- Link editor title, description, URL, and alt-text labels are now correctly
  associated with their inputs for browsers and assistive technology.
- User-upload images still render as ordinary `<img>` elements because their
  source may be a local blob preview or a runtime S3 URL. The intentional raw
  image boundary is now documented in one component, leaving lint clean.

No Prisma schema change or database migration is included in this patch.

## Apply locally

From the project root:

```powershell
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Install the E2E browser once per machine, then run the critical flow:

```powershell
npm.cmd run test:e2e:install
npm.cmd run test:e2e
```

The E2E test reads `DATABASE_URL` and the optional `E2E_*` variables from
`.env`. By default it uses the local seeded `admin` account. Override
`E2E_ADMIN_PASSWORD` if the seed password was changed.

## Required production settings

Set these in the deployment platform, never in committed source:

```env
DATABASE_URL=postgresql://...
RATE_LIMIT_BACKEND=upstash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
RATE_LIMIT_REDIS_TIMEOUT_MS=2000
ASSET_STORAGE_ADAPTER=s3
S3_ENDPOINT=https://...
S3_BUCKET=...
S3_REGION=auto
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://...
LINKZZZ_APP_HOSTS=linkzzz.com,www.linkzzz.com
```

Validate the configured environment:

```powershell
npm.cmd run env:check
```

The command validates presence, adapter choices, HTTPS endpoints, PostgreSQL
URL shape, timeout range, and hostname formatting. It does not connect to or
mutate PostgreSQL, Upstash, or S3 and does not print secret values.

## Deployment order

```powershell
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npm.cmd run env:check
npm.cmd run build
npm.cmd run start
```

Before public traffic, configure automated PostgreSQL backups with the database
provider and verify that the S3 public base URL serves uploaded objects. Run the
Playwright flow against a staging database before running it against any shared
environment.

## Upstream dependency notes

- `npm audit` currently reports four high-severity advisories through the
  `prisma@7.10.0` CLI dependency tree (`@prisma/config`/`deepmerge-ts` and
  `mysql2`). The offered forced fix downgrades Prisma to 6, so it was not
  applied to this Prisma 7 project. Recheck after Prisma publishes a compatible
  dependency update; do not run `npm audit fix --force` blindly.
- `pg` 8.19+ emits a deprecation warning from Prisma's `PgTransaction` when
  Prisma internally dispatches relation work concurrently. The critical E2E
  flow passes, the warning originates in the adapter rather than Linkzzz query
  code, and the project remains pinned to the pg 8 major. Track
  [Prisma issue #29407](https://github.com/prisma/prisma/issues/29407) before
  any future pg 9 upgrade.

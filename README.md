# Linkzzz

Linkzzz is a Next.js 16 SaaS for intelligent public links. A customer can own multiple Smart Links, either hosted Landing Pages or Direct redirects, with provider-aware destinations, deeplinking, Geo rules, Traffic Shield, custom domains, analytics, advanced page cards/blocks, scheduling and campaign behavior.

The application uses PostgreSQL through Prisma. There is no parallel JSON persistence layer.

## Plans

Current plans are:

| Plan | Smart Links | Links/cards per Landing Page |
| --- | ---: | ---: |
| BASIC | 50 | 10 |
| PRO | 100 | 30 |
| ENTERPRISE | 200+ | 100 |

Enterprise currently uses a larger internal operational guardrail, but `200+` is the customer-facing Smart Link allowance.

## Local development

Create a local `.env` from `.env.example` and point `DATABASE_URL` at your PostgreSQL development database.

For a fresh checkout or a machine where generated files are absent:

```powershell
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npm.cmd run dev
```

For a deliberately disposable development database that needs to be rebuilt from scratch, use `npx.cmd prisma migrate reset --force` instead of `migrate deploy`.

Do not commit or distribute `.env`. Generated Prisma output lives under `src/generated/prisma` and is recreated by `prisma generate`.

## Quality gate

Run the non-browser checks first:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

The Playwright suite uses Chromium for desktop tests and WebKit for the mobile iPhone profile, so install both browsers once per Playwright version:

```powershell
npm.cmd run test:e2e:install
npm.cmd run test:e2e:repair
npm.cmd run test:e2e
```

`test:e2e:repair` is an idempotent compatibility helper for older local copies of `e2e/critical-flow.spec.ts`; it replaces the retired `Premium Plus` plan label with the current `Pro` label. Once every local branch is current, the helper can be removed.

If an intentional UI change invalidates approved screenshot baselines, inspect the diffs first and then update them explicitly:

```powershell
npm.cmd run test:e2e:update
npm.cmd run test:e2e
```

## Test artifacts

Playwright writes local output to `test-results/` and `playwright-report/`. They are ignored by Git and may be removed at any time:

```powershell
npm.cmd run clean:test-artifacts
```

`public/uploads/` is local development asset storage. Do not put it in a release archive. `src/generated/` is generated build input and should be regenerated rather than shipped as source.

## Release ZIP

Create a clean source archive with:

```powershell
npm.cmd run zip:release
```

By default this creates `linkzzz-release.zip` while excluding:

- `.env*` except `.env.example`;
- `node_modules/`;
- `.next/` and `out/`;
- `test-results/` and `playwright-report/`;
- `public/uploads/`;
- `src/generated/`;
- local runtime data, editor folders and existing ZIP archives.

A machine receiving that archive should run `npm install` and `prisma generate` before building.

## Production notes

Production deployment requires explicit configuration for PostgreSQL, shared/distributed rate limiting, object storage, trusted proxy behavior, custom domains, secrets, logging/monitoring and backups. Run:

```powershell
npm.cmd run env:check
```

before a production deployment. Never trust forwarded proxy headers unless the deployment is explicitly configured to do so.

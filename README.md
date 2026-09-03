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

For hosted PostgreSQL (including Neon), use `sslmode=verify-full`. Linkzzz also
normalizes the legacy `prefer`, `require` and `verify-ca` aliases to
`verify-full` in every application, seed and E2E connection path so current
certificate and hostname verification remains explicit.

For a fresh checkout or a machine where generated files are absent:

```powershell
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npm.cmd run dev
```

`npm run dev` uses Turbopack and prewarms the core application routes in the
background after startup. This moves most route compilation to startup instead
of making the first click on every screen pay that cost. Set
`LINKZZZ_DEV_PREWARM=0` only when you deliberately want raw on-demand
compilation, or use `npm run dev:raw`.

On Windows, keep the project outside OneDrive or another actively synchronized
folder (for example `C:\dev\linkzzz`). File synchronization and real-time virus
scanning multiply the filesystem work performed by the development compiler.
This affects `next dev`; it is not representative of `next build` plus
`next start` production performance.

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
npm.cmd run test:e2e
```

Before running Playwright, set `E2E_DATABASE_URL` to a disposable PostgreSQL
database that is separate from `DATABASE_URL`. The runner refuses to start when
the value is missing or points to the normal application database. It applies
migrations, seeds deterministic fixtures and removes only `e2e_`-prefixed
customers. The application continues to use its normal runtime contracts; no
authentication, rate-limit or storage behavior is changed to satisfy tests.

The default `test:e2e` command runs functional and accessibility checks. Visual
regression remains explicit because new screenshot baselines must be inspected
before approval.

If an intentional UI change invalidates approved screenshot baselines, inspect the diffs first and then update them explicitly:

```powershell
npm.cmd run test:e2e:visual:update
# Inspect every generated PNG.
npm.cmd run test:e2e:visual
```

Run `npm.cmd run test:e2e:all` only after approved baselines exist.

Do not preserve screenshot baselines captured while CSS failed to load. After a
style-system recovery, generate the matrix once, inspect the new PNGs, and then
run the visual suite as the actual regression check.

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
- TypeScript incremental build metadata (`*.tsbuildinfo`);
- local runtime data, editor folders and existing ZIP archives.

A machine receiving that archive should run `npm install` and `prisma generate` before building.

## Production notes

Production deployment requires explicit configuration for PostgreSQL, shared/distributed rate limiting, object storage, trusted proxy behavior, custom domains, secrets, logging/monitoring and backups. Run:

```powershell
npm.cmd run env:check
```

before a production deployment. Never trust forwarded proxy headers unless the deployment is explicitly configured to do so.

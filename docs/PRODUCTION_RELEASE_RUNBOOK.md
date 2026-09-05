# Linkzzz production release runbook

This runbook is the operational path from a validated `dev` commit to production. It is intentionally conservative around database migrations because application rollback and database rollback are not the same operation.

## 1. Branch and environment model

Expected mapping:

- `dev` -> Vercel Preview / staging environment
- `main` -> Vercel Production

Preview and Production must not silently share stateful infrastructure unless that sharing is deliberate. In particular verify PostgreSQL, rate-limit storage and object storage scopes before release.

## 2. Required production services

Before a release, `npm run env:check` must pass with real production values for:

- PostgreSQL / Neon `DATABASE_URL`;
- shared Upstash rate limiting;
- S3-compatible object storage;
- application/custom-domain host configuration;
- trusted proxy and Geo header policy;
- analytics hash salt;
- edge bot secret when verified crawler headers are enabled.

Local/memory rate limiting and local asset storage are development adapters, not production fallbacks.

## 3. Pre-release validation

On the exact commit intended for Preview:

```powershell
npm.cmd install
npx.cmd prisma generate
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e:functional -- --workers=1
```

Visual snapshots are not updated automatically. Inspect intentional UI changes before accepting a new baseline.

## 4. Database migration safety

Never run `prisma migrate reset` against Preview or Production.

Before `prisma migrate deploy`:

1. confirm the target `DATABASE_URL` is the intended environment;
2. create a provider snapshot / restore point or confirm PITR coverage where the database plan supports it;
3. inspect the pending migration SQL;
4. verify whether the migration is expand-only, destructive, or contract cleanup;
5. record the application commit SHA associated with the migration.

Run:

```powershell
npx.cmd prisma migrate deploy
```

### Phase 3.12 compatibility rule

`20260905143000_page_media_relations` is an **expand** migration. It adds/backfills first-class Page/PageCard fields and gallery asset relations while retaining the legacy JSON transport for one rollback compatibility window.

Do not remove the legacy `__media`, `__engagement` or PageCard `customStyle.__*` envelope in the same production release. The application dual-writes both representations during this window.

The later contract cleanup is a separate migration/release and should happen only after:

- the new persistence model has survived normal production traffic;
- there is no realistic need to roll back to a pre-3.12 application version;
- a fresh backup/restore point exists.

## 5. Preview deployment

Deploy the candidate from `dev` to Vercel Preview.

After the Preview URL is healthy, run the read-only deployed smoke:

```powershell
$env:E2E_EXTERNAL_SERVER="1"
$env:E2E_BASE_URL="https://YOUR-PREVIEW-URL.vercel.app"
$env:E2E_PUBLIC_SMART_LINK_SLUG="skyhook" # or another known published fixture
npm.cmd run test:e2e:production-smoke
```

`E2E_DATABASE_URL` is intentionally not required for external-server smoke mode because this suite does not migrate, seed or clean the deployed database.

The smoke verifies:

- static marketing homepage response/CSP;
- native navigation from marketing into `/login`;
- strict nonce CSP on application surfaces;
- internal custom-domain runtime path isolation;
- optionally, one known published public SmartLink.

## 6. Manual Preview checks

At minimum check desktop and mobile:

- landing -> Login;
- customer login/logout;
- SmartLink list;
- Landing Page editor save/publish;
- Direct SmartLink edit;
- one public Landing Page;
- one outbound card/social route;
- analytics dashboard;
- admin user detail/action surface;
- image upload and replacement;
- custom-domain UI status.

Do not use visual snapshot approval as a substitute for these checks.

## 7. Production promotion

Only after Preview validation:

1. make sure `dev` contains the exact validated commit;
2. create `dev -> main` PR;
3. confirm no unexpected commits landed on either branch;
4. merge using the repository's normal protected path;
5. confirm Vercel Production deploy references the expected merge/head SHA;
6. run `npm run env:check` against the production configuration where operationally available;
7. apply only the production migrations that were reviewed for this release;
8. wait for deployment health before changing DNS or domain routing behavior.

## 8. Post-deploy verification

Repeat the deployed smoke against the production application host:

```powershell
$env:E2E_EXTERNAL_SERVER="1"
$env:E2E_BASE_URL="https://linkzzz.com"
$env:E2E_PUBLIC_SMART_LINK_SLUG="KNOWN-PUBLISHED-SLUG"
npm.cmd run test:e2e:production-smoke
```

Then check monitoring/logs for:

- new structured `server_error` events;
- migration/database errors;
- elevated 5xx rate;
- object-storage failures;
- rate-limit backend failures;
- custom-domain verification/routing failures.

## 9. Rollback

### Application-only problem

If the database migration is backward compatible with the previous app version, use the Vercel rollback/redeploy path to restore the last known-good application commit.

### Migration changed compatibility

Do not assume reverting the application also reverts the database. Prisma migrations are forward history.

For an incompatible schema/data failure:

1. stop further writes if continuing traffic can corrupt state;
2. prefer a forward fix when safe;
3. otherwise restore the database from the pre-release provider snapshot/PITR point;
4. redeploy the matching application commit;
5. verify the restored migration table and application data before reopening traffic.

Never hand-edit Prisma migration history in production to make the dashboard look green.

## 10. After the first green release

Once this audit batch has passed the full mass gate and one Preview deployment:

- enable a permanent GitHub CI quality gate for `typecheck`, `lint`, unit tests and build;
- keep functional E2E as a DB-backed gate where secrets/infrastructure allow it;
- keep visual baseline updates explicit;
- schedule the Phase 3.12 contract cleanup only after its compatibility window.

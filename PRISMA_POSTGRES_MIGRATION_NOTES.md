# Linkzzz Prisma/PostgreSQL persistence patch

Prisma/PostgreSQL is the only application runtime persistence adapter. The old
JSON persistence files have been removed and `PERSISTENCE_ADAPTER=json` is not
supported.

## Environment

Keep the existing `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/linkzzz?schema=public"
```

Optional seed password overrides (defaults remain the existing dev credentials):

```env
DEV_ADMIN_PASSWORD="LinkzzzAdmin!2026"
DEV_SKYHOOK_PASSWORD="LinkzzzSky!2026"
```

## Apply

From the project root, after extracting this ZIP over the project:

```powershell
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate reset --force
npx.cmd prisma db seed
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

The SmartLink schema cleanup intentionally replaces the old development
migration history. Run `prisma migrate reset --force` once on every existing
development database. It deletes the schema and all local data, applies the new
clean initial migration, and then the explicit seed command restores mock data.

## Seeded development accounts

- Admin: `admin` / `LinkzzzAdmin!2026`
- Customer: `skyhook` / `LinkzzzSky!2026`

The seed is idempotent, uses the existing scrypt hashing layer, refreshes
development credential hashes, creates a populated `/skyhook` Landing Page,
and adds a draft `/skyhook-listen` Direct SmartLink. It only inserts PageCards
and social accounts when the seeded page does not already contain them.

## Persistence design

- Application services import only `getServerDependencies`; they do not import Prisma.
- Prisma 7 uses one central client with `@prisma/adapter-pg` and a development singleton.
- `SmartLinkRepository` owns top-level Landing Page and Direct Link records.
- `ProfileRepository.upsert` remains the transitional service name, but it
  persists `Page`, `PageCard`, `PageCardGeoDestination`, `SocialLink`, and
  `PageStat` atomically.
- Subscription upserts also append SubscriptionHistory.
- AnalyticsEvent, Asset, CustomDomain, and AuditLog have Prisma repository adapters available through the dependency container.

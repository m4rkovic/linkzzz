# Linkzzz Prisma/PostgreSQL persistence patch

Prisma/PostgreSQL is the default persistence adapter. The existing JSON adapter is retained only as an explicit local fallback.

## Environment

Keep the existing `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/linkzzz?schema=public"
```

Optional JSON fallback:

```env
PERSISTENCE_ADAPTER=json
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
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

For a local database whose existing `init` migration has already been applied, do not create another schema migration: this patch uses the existing `prisma/schema.prisma`. Use `prisma migrate deploy` to apply any checked-in pending migrations, then seed.

For a brand-new local development database, if no migration exists yet:

```powershell
npx.cmd prisma migrate dev --name init
npx.cmd prisma db seed
```

## Seeded development accounts

- Admin: `admin` / `LinkzzzAdmin!2026`
- Customer: `skyhook` / `LinkzzzSky!2026`

The seed is idempotent for users and profile creation, uses the existing scrypt hashing layer, and refreshes development credential hashes. Override both passwords through environment variables outside local development.

## Persistence design

- Application services import only `getServerDependencies`; they do not import Prisma.
- Prisma 7 uses one central client with `@prisma/adapter-pg` and a development singleton.
- `ProfileRepository.upsert` persists Profile, Link, GeoDestination, SocialLink, and ProfileStat atomically.
- Subscription upserts also append SubscriptionHistory.
- AnalyticsEvent, Asset, CustomDomain, and AuditLog have Prisma repository adapters available through the dependency container.

# Linkzzz Backend Phase 1 — JSON persistence

> Historical note: this adapter is no longer connected to the application
> runtime. Prisma/PostgreSQL is now mandatory. These files remain only as a
> reference for the early development phase.

This patch adds a local server-only JSON persistence adapter.

## Runtime database

Seed files live in:

```text
mock-db/seed/
```

On first server access they are copied to:

```text
.linkzzz-data/
```

`.linkzzz-data/` is intentionally gitignored.

Optional custom directory:

```text
LINKZZZ_JSON_DB_DIR=C:\some\directory
```

## Added repositories

- JsonUserRepository
- JsonSubscriptionRepository
- JsonPasswordCredentialRepository
- JsonSessionRepository
- JsonAuditWriter

Application/server code should depend on the interfaces in:

```text
src/server/services/contracts.ts
```

not directly on JSON files.

Later Prisma/PostgreSQL adapters can replace these repositories without changing higher-level auth/business services.

## Important

This JSON store is for local/single-process development only. It has an in-process write lock and temp-file replacement, but it is not a production database and does not provide database transactions or multi-instance concurrency guarantees.

import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import { expect, test } from "./test";

test("application timestamps are stored with timezone information", async () => {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{
      tableName: string;
      columnName: string;
      dataType: string;
    }>(
      `SELECT table_name AS "tableName",
              column_name AS "columnName",
              data_type AS "dataType"
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name <> '_prisma_migrations'
         AND data_type LIKE 'timestamp%'
       ORDER BY table_name, ordinal_position`,
    );

    expect(result.rows.length).toBeGreaterThan(0);
    expect(
      result.rows.filter((column) => column.dataType !== "timestamp with time zone"),
    ).toEqual([]);
  } finally {
    await database.end();
  }
});

test("database query-support indexes and domain verification invariant are deployed", async () => {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const indexes = await database.query<{ indexName: string }>(
      `SELECT indexname AS "indexName"
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = ANY($1::text[])
       ORDER BY indexname`,
      [[
        "AnalyticsEvent_pageCardId_type_createdAt_idx",
        "AnalyticsEvent_smartLinkId_createdAt_idx",
        "AnalyticsEvent_smartLinkId_isBot_type_createdAt_idx",
        "PageCard_pageId_sortOrder_idx",
      ]],
    );

    expect(indexes.rows.map((row) => row.indexName)).toEqual([
      "AnalyticsEvent_pageCardId_type_createdAt_idx",
      "AnalyticsEvent_smartLinkId_createdAt_idx",
      "AnalyticsEvent_smartLinkId_isBot_type_createdAt_idx",
      "PageCard_pageId_sortOrder_idx",
    ]);

    const constraint = await database.query<{ validated: boolean }>(
      `SELECT constraint_record.convalidated AS validated
       FROM pg_constraint AS constraint_record
       INNER JOIN pg_class AS table_record
         ON table_record.oid = constraint_record.conrelid
       WHERE table_record.relname = 'CustomDomain'
         AND constraint_record.conname = 'CustomDomain_active_requires_verification'`,
    );

    expect(constraint.rows).toEqual([{ validated: true }]);
  } finally {
    await database.end();
  }
});

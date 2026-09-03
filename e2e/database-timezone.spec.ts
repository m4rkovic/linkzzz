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

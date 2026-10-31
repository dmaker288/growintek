import "dotenv/config";
import Database from "better-sqlite3";
import { openDatabase } from "../server/db.js";
import { resolve } from "node:path";
if (!process.env.DATABASE_URL)
  throw new Error("Set the target PostgreSQL DATABASE_URL first.");
if (!process.argv[2])
  throw new Error(
    "Usage: npm run db:import -- /absolute/path/to/source.sqlite",
  );
const source = new Database(resolve(process.argv[2]), {
  readonly: true,
  fileMustExist: true,
});
const target = openDatabase();
try {
  if (target.provider !== "postgresql")
    throw new Error("The target must be PostgreSQL.");
  await target.transaction(async () => {
    for (const table of [
      "documents",
      "admins",
      "settings",
      "jobs",
      "events",
      "audit_log",
    ])
      if ((await target.prepare(`SELECT count(*) n FROM ${table}`).get()).n)
        throw new Error(
          "Import requires an empty target database. Existing cloud data was not changed.",
        );
    for (const table of [
      "settings",
      "documents",
      "admins",
      "jobs",
      "events",
      "audit_log",
      "schema_migrations",
    ]) {
      const rows = source.prepare(`SELECT * FROM ${table}`).all();
      for (const row of rows) {
        const columns = Object.keys(row);
        await target
          .prepare(
            `INSERT INTO ${table}(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`,
          )
          .run(...Object.values(row));
      }
    }
    for (const table of ["events", "audit_log"])
      await target
        .prepare(
          `SELECT setval(pg_get_serial_sequence('${table}','id'),COALESCE((SELECT MAX(id) FROM ${table}),0)+1,false)`,
        )
        .get();
  })();
  console.log(
    "Imported content, settings, admins, finances, jobs and event history. Sessions were excluded; sign in again. Upload media through the CMS after connecting the target.",
  );
} finally {
  source.close();
  await target.close();
}

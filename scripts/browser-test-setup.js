import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { openDatabase, seed, now } from "../server/db.js";
import { hashPassword } from "../server/security.js";
// Separate disposable database. This never touches data/growintek.sqlite.
const directory = "/tmp/grow-browser-tests";
mkdirSync(directory, { recursive: true, mode: 0o700 });
process.env.FORCE_SQLITE = "1";
const db = openDatabase(`${directory}/test.sqlite`);
await seed(db);
await db.transaction(async () => {
  await db.prepare("DELETE FROM sessions").run();
  await db.prepare("DELETE FROM admins").run();
  await db.prepare("DELETE FROM documents").run();
  await db.prepare("DELETE FROM settings").run();
  await db.prepare("DELETE FROM schema_migrations").run();
  await db.prepare("DELETE FROM jobs").run();
  await db.prepare("DELETE FROM events").run();
  await db.prepare("DELETE FROM audit_log").run();
})();
await seed(db);
const password = randomBytes(24).toString("base64url");
await db
  .prepare("INSERT INTO admins VALUES(?,?,?,?)")
  .run(
    randomUUID(),
    "browser-test@example.com",
    await hashPassword(password),
    now(),
  );
writeFileSync(
  `${directory}/credentials.json`,
  JSON.stringify({ email: "browser-test@example.com", password }),
  { mode: 0o600 },
);
db.close();
console.log(
  "Disposable browser test database initialized. Credentials are private and temporary.",
);

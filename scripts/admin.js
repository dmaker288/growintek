import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { openDatabase, seed, now } from "../server/db.js";
import { hashPassword } from "../server/security.js";
process.umask(0o077);
const email = process.argv[2]?.toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error("Usage: npm run admin:create -- you@example.com");
let password = process.env.ADMIN_PASSWORD;
if (!password) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY),
  });
  process.stdout.write(
    "Enter a unique password (at least 14 characters). Input is hidden.\n",
  );
  const output = rl._writeToOutput;
  rl._writeToOutput = () => {};
  password = await rl.question("");
  rl._writeToOutput = output;
  rl.close();
}
if (password.length < 14 || password.length > 256)
  throw new Error("Use a password between 14 and 256 characters.");
const db = openDatabase();
await seed(db);
const existing = await db
  .prepare("SELECT id FROM admins WHERE email=?")
  .get(email);
const encoded = await hashPassword(password);
if (existing) {
  await db.transaction(async () => {
    await db
      .prepare("UPDATE admins SET password_hash=? WHERE id=?")
      .run(encoded, existing.id);
    await db.prepare("DELETE FROM sessions WHERE admin_id=?").run(existing.id);
  })();
} else
  await db
    .prepare("INSERT INTO admins VALUES(?,?,?,?)")
    .run(randomUUID(), email, encoded, now());
console.log(
  `Administrator ${existing ? "updated" : "created"}. Sign in at /admin.`,
);
db.close();

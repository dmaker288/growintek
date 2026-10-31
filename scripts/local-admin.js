import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { openDatabase, seed, now } from "../server/db.js";
import { hashPassword } from "../server/security.js";
if (
  process.env.DATABASE_URL ||
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL
)
  throw new Error("Local administrator setup is for the SQLite preview only.");
const db = openDatabase();
await seed(db);
try {
  if ((await db.prepare("SELECT count(*) n FROM admins").get()).n) {
    console.log("An administrator already exists; no credentials changed.");
  } else {
    const email = "admin@growintek.local",
      password = randomBytes(24).toString("base64url");
    await db
      .prepare("INSERT INTO admins VALUES(?,?,?,?)")
      .run(randomUUID(), email, await hashPassword(password), now());
    mkdirSync("data", { recursive: true, mode: 0o700 });
    writeFileSync(
      "data/local-admin.txt",
      `Local preview only\nSign in: http://localhost:4173/admin\nEmail: ${email}\nPassword: ${password}\n\nCreate your production account separately with npm run admin:create.\n`,
      { mode: 0o600 },
    );
    console.log(
      "Local preview administrator created. Credentials are saved privately in data/local-admin.txt.",
    );
  }
} finally {
  await db.close();
}

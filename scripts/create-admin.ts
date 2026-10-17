import { PrismaClient } from "@prisma/client";

import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Creates or updates an admin account with a password.
 * Usage:  npm run admin:create -- you@example.com [password] ["Your Name"]
 */
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3]?.trim() || process.env.ADMIN_PASSWORD || "Admin2026!";
  const name = process.argv[4]?.trim() ?? "Admin";

  if (!email || !email.includes("@")) {
    console.error("Usage: npm run admin:create -- you@example.com [password] [\"Your Name\"]");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, role: "ADMIN", passwordHash: hashPassword(password) },
    update: { role: "ADMIN", disabled: false, name: name ?? undefined, passwordHash: hashPassword(password) },
  });

  console.log(`✓ ${user.email} can sign in at /admin/login with password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

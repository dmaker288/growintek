import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Creates the first admin account without needing a login.
 * Usage:  npm run admin:create -- you@example.com "Your Name"
 */
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const name = process.argv[3]?.trim() ?? null;

  if (!email || !email.includes("@")) {
    console.error("Usage: npm run admin:create -- you@example.com \"Your Name\"");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, role: "ADMIN" },
    update: { role: "ADMIN", disabled: false, name: name ?? undefined },
  });

  console.log(`✓ ${user.email} can sign in at /admin/login (role: ${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

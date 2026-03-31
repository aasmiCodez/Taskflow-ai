require("dotenv").config();
const { PrismaClient, Role } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD || "Admin@123";
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@taskflow.ai" },
    update: {
      name: "Aarav Admin",
      role: Role.ADMIN,
      passwordHash,
      passwordSetupRequired: false,
      passwordSetupTokenHash: null,
      passwordSetupExpiresAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      managerId: null,
    },
    create: {
      name: "Aarav Admin",
      email: "admin@taskflow.ai",
      role: Role.ADMIN,
      passwordHash,
      passwordSetupRequired: false,
      passwordSetupTokenHash: null,
      passwordSetupExpiresAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  const pmo = await prisma.user.upsert({
    where: { email: "pmo@taskflow.ai" },
    update: {
      name: "Priya PMO",
      role: Role.PMO,
      passwordHash,
      passwordSetupRequired: false,
      passwordSetupTokenHash: null,
      passwordSetupExpiresAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      managerId: null,
    },
    create: {
      name: "Priya PMO",
      email: "pmo@taskflow.ai",
      role: Role.PMO,
      passwordHash,
      passwordSetupRequired: false,
      passwordSetupTokenHash: null,
      passwordSetupExpiresAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  const managers = await Promise.all([
    prisma.user.upsert({
      where: { email: "manager.one@taskflow.ai" },
      update: {
        name: "Meera Manager",
        role: Role.MANAGER,
        passwordHash,
        passwordSetupRequired: false,
        passwordSetupTokenHash: null,
        passwordSetupExpiresAt: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        managerId: null,
      },
      create: {
        name: "Meera Manager",
        email: "manager.one@taskflow.ai",
        role: Role.MANAGER,
        passwordHash,
        passwordSetupRequired: false,
        passwordSetupTokenHash: null,
        passwordSetupExpiresAt: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    }),
    prisma.user.upsert({
      where: { email: "manager.two@taskflow.ai" },
      update: {
        name: "Kabir Manager",
        role: Role.MANAGER,
        passwordHash,
        passwordSetupRequired: false,
        passwordSetupTokenHash: null,
        passwordSetupExpiresAt: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        managerId: null,
      },
      create: {
        name: "Kabir Manager",
        email: "manager.two@taskflow.ai",
        role: Role.MANAGER,
        passwordHash,
        passwordSetupRequired: false,
        passwordSetupTokenHash: null,
        passwordSetupExpiresAt: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    }),
  ]);

  const teamMembers = [
    ["member.one@taskflow.ai", "Anaya Member", managers[0].id],
    ["member.two@taskflow.ai", "Ishaan Member", managers[0].id],
    ["member.three@taskflow.ai", "Diya Member", managers[0].id],
    ["member.four@taskflow.ai", "Arjun Member", managers[0].id],
    ["member.five@taskflow.ai", "Sara Member", managers[1].id],
    ["member.six@taskflow.ai", "Vihaan Member", managers[1].id],
    ["member.seven@taskflow.ai", "Myra Member", managers[1].id],
    ["member.eight@taskflow.ai", "Reyansh Member", managers[1].id],
  ];

  for (const [email, name, managerId] of teamMembers) {
    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: Role.MEMBER,
        passwordHash,
        passwordSetupRequired: false,
        passwordSetupTokenHash: null,
        passwordSetupExpiresAt: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        managerId,
      },
      create: {
        name,
        email,
        role: Role.MEMBER,
        passwordHash,
        passwordSetupRequired: false,
        passwordSetupTokenHash: null,
        passwordSetupExpiresAt: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        managerId,
      },
    });
  }

  console.log("Seeded demo users successfully.");
  console.log("Use the SEED_DEFAULT_PASSWORD environment variable to control their initial password.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

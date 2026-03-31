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
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@taskflow.ai" },
    update: {
      name: "Aarav Admin",
      role: Role.ADMIN,
      passwordHash,
      passwordSetupRequired: false,
      managerId: null,
    },
    create: {
      name: "Aarav Admin",
      email: "admin@taskflow.ai",
      role: Role.ADMIN,
      passwordHash,
      passwordSetupRequired: false,
    },
  });

  const pmo = await prisma.user.upsert({
    where: { email: "pmo@taskflow.ai" },
    update: {
      name: "Priya PMO",
      role: Role.PMO,
      passwordHash,
      passwordSetupRequired: false,
      managerId: null,
    },
    create: {
      name: "Priya PMO",
      email: "pmo@taskflow.ai",
      role: Role.PMO,
      passwordHash,
      passwordSetupRequired: false,
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
        managerId: null,
      },
      create: {
        name: "Meera Manager",
        email: "manager.one@taskflow.ai",
        role: Role.MANAGER,
        passwordHash,
        passwordSetupRequired: false,
      },
    }),
    prisma.user.upsert({
      where: { email: "manager.two@taskflow.ai" },
      update: {
        name: "Kabir Manager",
        role: Role.MANAGER,
        passwordHash,
        passwordSetupRequired: false,
        managerId: null,
      },
      create: {
        name: "Kabir Manager",
        email: "manager.two@taskflow.ai",
        role: Role.MANAGER,
        passwordHash,
        passwordSetupRequired: false,
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
        managerId,
      },
      create: {
        name,
        email,
        role: Role.MEMBER,
        passwordHash,
        passwordSetupRequired: false,
        managerId,
      },
    });
  }

  console.log("Seeded demo users:");
  console.log("admin@taskflow.ai / Admin@123");
  console.log("pmo@taskflow.ai / Admin@123");
  console.log("manager.one@taskflow.ai / Admin@123");
  console.log("manager.two@taskflow.ai / Admin@123");
  console.log("member.one@taskflow.ai / Admin@123");
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

const { app } = require("../src/app");
const { prisma } = require("../src/db");
const { connectRedis } = require("../src/redis");

let bootstrapPromise;

async function bootstrap() {
  await prisma.$connect();
  await connectRedis();
}

module.exports = async (req, res) => {
  try {
    bootstrapPromise ||= bootstrap();
    await bootstrapPromise;
  } catch (error) {
    bootstrapPromise = null;
    console.error("Vercel backend bootstrap failed", error);
    return res.status(500).json({ message: "Backend bootstrap failed." });
  }

  return app(req, res);
};

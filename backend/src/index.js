const { app } = require("./app");
const { prisma } = require("./db");
const { config } = require("./config");
const { connectRedis, disconnectRedis } = require("./redis");
const logger = require("./logger");

async function start() {
  try {
    await prisma.$connect();
    await connectRedis();

    app.listen(config.port, () => {
      logger.info(`TaskFlow AI server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

async function stop() {
  await prisma.$disconnect();
  await disconnectRedis();
  logger.info("TaskFlow AI server gracefully shutting down");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

start();

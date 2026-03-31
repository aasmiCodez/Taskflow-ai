const { createClient } = require("redis");
require("dotenv").config();

const redisUrl = process.env.REDIS_URL || "";
const redisClient = redisUrl
  ? createClient({ url: redisUrl })
  : {
      isOpen: false,
      on() {},
      async get() {
        return null;
      },
      async setEx() {},
      async keys() {
        return [];
      },
      async del() {
        return 0;
      },
    };

redisClient.on("error", (err) => {
  console.error("Redis error", err);
});

async function connectRedis() {
  if (typeof redisClient.connect === "function" && !redisClient.isOpen) {
    await redisClient.connect();
  }
}

async function disconnectRedis() {
  if (typeof redisClient.quit === "function" && redisClient.isOpen) {
    await redisClient.quit();
  }
}

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
};

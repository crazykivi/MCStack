const { createClient } = require("redis");

let client;

async function connectWithRetry() {
  const maxRetries = 10;
  let retries = 0;

  while (!client && retries < maxRetries) {
    try {
      client = createClient({
        socket: {
          host: process.env.REDIS_HOST || "redis",
          port: process.env.REDIS_PORT || 6379,
        },
      });

      await client.connect();
      console.log("Подключение к Redis выполнено");

      client.on("error", (err) => {
        console.error("Redis error:", err.message);
      });

      return client;
    } catch (err) {
      console.warn(
        `Ошибка подключения к Redis (попытка ${retries + 1}/${maxRetries}):`,
        err.message
      );
      console.error("Полная ошибка:", err);
      retries++;
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  throw new Error("Не удалось подключиться к Redis после всех попыток");
}

connectWithRetry();

// Экспорт методов работы с Redis
module.exports = {
  async get(path) {
    if (!client) return null;
    const key = `folder_size:${path}`;
    try {
      const cached = await client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.error("Redis GET ошибка:", err.message);
      return null;
    }
  },
  async set(path, value, ttl = 60 * 5) {
    if (!client) return;
    const key = `folder_size:${path}`;
    try {
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (err) {
      console.error("Redis SET ошибка:", err.message);
    }
  },
  async delete(path) {
    if (!client) return;
    const key = `folder_size:${path}`;
    try {
      await client.del(key);
    } catch (err) {
      console.error("Redis DEL ошибка:", err.message);
    }
  },
};
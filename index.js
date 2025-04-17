const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const {
  // getVanillaServerUrl,
  downloadFile,
} = require("./utils/downloadMinecraft");
const { downloadAndExtractJava } = require("./utils/downloadJava");
const {
  startMinecraftServer,
  acceptEULA,
  stopMinecraftServer,
  saveMinecraftServer,
} = require("./utils/serverManager");
const { getRequiredJavaVersion } = require("./utils/versionUtils");
const { authenticateRequest } = require("./middleware/serverAuth");
const config = require("./config/config.json");

const app = express();
const PORT = 3001;

function getDefaultParams(query) {
  const type = query.type || config.defaultServerType;
  const version = query.version || config.defaultServerVersion;
  return { type, version };
}

app.get("/start", authenticateRequest, async (req, res) => {
  const { type, version } = getDefaultParams(req.query);

  try {
    // Определение требуемой версии Java
    const requiredJavaVersion = getRequiredJavaVersion(version);
    console.log(`Требуемая версия Java: ${requiredJavaVersion}`);

    // Скачивание Java
    const javaPath = await downloadAndExtractJava(requiredJavaVersion);

    // Скачивание сервера Minecraft
    // const serverUrl = await getVanillaServerUrl(version); // старое обращение к скачиванию сервера
    const serverUrl = await getServerUrl(type, version);
    const serverDir = path.join(
      __dirname,
      config.serverDirectory,
      `${type}-${version}`
    );
    await fs.ensureDir(serverDir);
    const serverJarPath = path.join(serverDir, "server.jar");
    await downloadFile(serverUrl, serverJarPath);

    await acceptEULA(serverDir);

    // Запуск сервера Minecraft
    const memoryOptions = `-Xmx${config.maxMemory} -Xms${config.minMemory}`;
    const command = `${javaPath} ${memoryOptions} -jar server.jar nogui`;
    startMinecraftServer(command, serverDir);

    res.send(`Сервер Minecraft ${type} версии ${version} успешно запущен.`);
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error.message);
    res.status(500).send(`Ошибка: ${error.message}`);
  }
});

async function getServerUrl(type, version) {
  switch (type) {
    case "vanilla":
      return getVanillaServerUrl(version);
    case "mods":
      throw new Error("Поддержка mods пока не реализована.");
    case "plugins":
      throw new Error("Поддержка plugins пока не реализована.");
    default:
      throw new Error(`Неизвестный тип сервера: ${type}`);
  }
}

// Маршрут для остановки сервера
app.get("/stop", authenticateRequest, (req, res) => {
  const stopped = stopMinecraftServer();
  if (stopped) {
    res.send("[Minecraft Server]: Команда stop отправлена.");
  } else {
    res.status(400).send("[Minecraft Server]: Сервер не запущен.");
  }
});

// Маршрут для сохранения мира
app.get("/save", authenticateRequest, (req, res) => {
  const saved = saveMinecraftServer();
  if (saved) {
    res.send("[Minecraft Server]: Команда save-all отправлена.");
  } else {
    res.status(400).send("[Minecraft Server]: Сервер не запущен.");
  }
});

// Маршрут для перезапуска сервера
app.get("/restart", authenticateRequest, async (req, res) => {
  const { type, version } = req.query;

  if (!type || !version) {
    return res.status(400).send("Необходимо указать параметры type и version.");
  }

  try {
    // Остановка сервера
    const stopped = stopMinecraftServer();
    if (!stopped) {
      return res.status(400).send("[Minecraft Server]: Сервер не запущен.");
    }

    // Запуск сервера
    const requiredJavaVersion = getRequiredJavaVersion(version);
    console.log(`Требуемая версия Java: ${requiredJavaVersion}`);

    const javaPath = await downloadAndExtractJava(requiredJavaVersion);

    const serverUrl = await getServerUrl(type, version);
    const serverDir = path.join(
      __dirname,
      config.serverDirectory,
      `${type}-${version}`
    );
    await fs.ensureDir(serverDir);
    const serverJarPath = path.join(serverDir, "server.jar");
    await downloadFile(serverUrl, serverJarPath);

    await acceptEULA(serverDir);

    const memoryOptions = `-Xmx${config.maxMemory} -Xms${config.minMemory}`;
    const command = `${javaPath} ${memoryOptions} -jar server.jar nogui`;
    startMinecraftServer(command, serverDir);

    res.send(`Сервер Minecraft ${type} версии ${version} успешно перезапущен.`);
  } catch (error) {
    console.error("Ошибка при перезапуске сервера:", error.message);
    res.status(500).send(`Ошибка: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`API запущено на http://localhost:${PORT}`);
});

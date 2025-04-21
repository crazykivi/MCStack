const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const {
  getVanillaServerUrl,
  getModsServerUrl,
  downloadFile,
} = require("./utils/downloadMinecraft");
const { downloadAndExtractJava } = require("./utils/downloadJava");
const {
  startMinecraftServer,
  acceptEULA,
  stopMinecraftServer,
  saveMinecraftServer,
  getServerProcess,
  getPlayerCount,
  getMemoryUsage,
} = require("./utils/serverManager");
const { getRequiredJavaVersion } = require("./utils/versionUtils");
const { authenticateRequest } = require("./middleware/serverAuth");
const { spawn } = require("child_process");
const config = require("./config/config.json");

const app = express();
const PORT = 3001;

function getDefaultParams(query) {
  const type = query.type || config.defaultServerType;
  const version = query.version || config.defaultServerVersion;
  return { type, version };
}

app.use(express.json());

app.get("/start", authenticateRequest, async (req, res) => {
  const { type, version } = getDefaultParams(req.query);
  const core = req.query.core;

  try {
    const serverProcess = getServerProcess();
    if (serverProcess && !serverProcess.killed) {
      console.log("[Minecraft Server]: Останавливаю предыдущий сервер...");
      stopMinecraftServer();
    }

    const requiredJavaVersion = getRequiredJavaVersion(version);
    console.log(`Требуемая версия Java: ${requiredJavaVersion}`);

    const javaPath = await downloadAndExtractJava(requiredJavaVersion);

    const serverDir = path.join(
      __dirname,
      config.serverDirectory,
      `${type}-${version}`
    );
    await fs.ensureDir(serverDir);

    await prepareServerEnvironment(serverDir, type, version, core, javaPath);

    if (type === "vanilla") {
      await startVanillaServer(serverDir, version, core, javaPath);
    } else if (type === "mods" && core === "forge") {
      await startForgeServer(serverDir, version, core, javaPath);
    } else {
      throw new Error(`Неизвестный тип сервера: ${type}`);
    }

    res.send(`Сервер Minecraft ${type} версии ${version} успешно запущен.`);
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error.message);
    res.status(500).send(`Ошибка: ${error.message}`);
  }
});

async function prepareServerEnvironment(
  serverDir,
  type,
  version,
  core,
  javaPath
) {
  if (type === "mods") {
    const modsDir = path.join(serverDir, "mods");
    await fs.ensureDir(modsDir);
  }

  await acceptEULA(serverDir);
  const userJvmArgsPath = path.join(serverDir, "user_jvm_args.txt");
  await fs.writeFile(
    userJvmArgsPath,
    `-Xmx${config.maxMemory} -Xms${config.minMemory}`
  );
}

// Запуск Vanilla-сервера
async function startVanillaServer(serverDir, version, core, javaPath) {
  const serverJarPath = path.join(serverDir, "server.jar");
  const serverUrl = await getServerUrl("vanilla", version, core);
  await downloadFile(serverUrl, serverJarPath);
  console.log("[Vanilla]: Сервер скачан:", serverJarPath);

  const memoryOptions = `-Xmx${config.maxMemory} -Xms${config.minMemory}`;
  const command = `${javaPath} ${memoryOptions} -jar server.jar nogui`;
  startMinecraftServer(command, serverDir);
}

// Запуск Forge-сервера
async function startForgeServer(serverDir, version, core, javaPath) {
  const installerData = await getServerUrl("mods", version, core);
  const installerUrl = installerData.url;
  const installerJarPath = path.join(serverDir, "forge-installer.jar");
  await downloadFile(installerUrl, installerJarPath);

  console.log("[Forge]: Установка Forge в headless режиме...");
  const installCommand = `${javaPath} -Djava.awt.headless=true -jar forge-installer.jar --installServer`;
  await executeCommand(installCommand, serverDir);

  const runScript = path.join(serverDir, "run.sh");
  if (!fs.existsSync(runScript)) {
    throw new Error("Скрипт запуска сервера (run.sh) не найден.");
  }

  // Переписывание run.sh для использования скачанной Java
  const updatedRunScriptContent = `
  #!/usr/bin/env sh
  # Add custom JVM arguments (such as RAM allocation) to the user_jvm_args.txt
  
  ${javaPath} -jar forge-${version}-${installerData.version}-shim.jar --onlyCheckJava || exit 1
  
  # Add custom program arguments (such as nogui) to the next line before the "$@" or pass them to this script directly
  ${javaPath} @user_jvm_args.txt @libraries/net/minecraftforge/forge/${version}-${installerData.version}/unix_args.txt "$@"`.trim();
  await fs.writeFile(runScript, updatedRunScriptContent, { mode: 0o755 }); // Файл делается исполняемым

  // Запускаем сервер через run.sh
  const command = `bash ${runScript} nogui`;
  startMinecraftServer(command, serverDir);
}

async function executeCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const [executable, ...args] = command.split(" ");
    const process = spawn(executable, args, { cwd });

    process.stdout.on("data", (data) => {
      console.log(`[Command Output]: ${data.toString().trim()}`);
    });

    process.stderr.on("data", (data) => {
      console.error(`[Command Error]: ${data.toString().trim()}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Команда завершилась с кодом ${code}`));
      }
    });
  });
}

async function getServerUrl(type, version, core) {
  switch (type) {
    case "vanilla":
      return getVanillaServerUrl(version);
    case "mods":
      // throw new Error("Поддержка mods в процессе реализации.");
      if (!core || !["forge", "fabric"].includes(core)) {
        throw new Error(
          "Для типа 'mods' необходимо указать ядро: forge или fabric."
        );
      }
      return getModsServerUrl(version, core);
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

app.post("/command", authenticateRequest, (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).send("Необходимо указать параметр 'command'.");
  }

  try {
    sendCommandToServer(command);
    res.send(`Команда успешно отправлена: ${command}`);
  } catch (error) {
    console.error("Ошибка при отправке команды:", error.message);
    res.status(500).send(`Ошибка: ${error.message}`);
  }
});

app.get("/status", authenticateRequest, (req, res) => {
  const serverProcess = getServerProcess();
  const isRunning = serverProcess && !serverProcess.killed;

  res.json({
    status: isRunning ? "running" : "stopped",
    playersOnline: getPlayerCount(), // Реализуйте функцию для подсчета игроков
    memoryUsage: getMemoryUsage(), // Реализуйте функцию для мониторинга RAM
  }); // ДОБАВИТЬ ЛОГИРОВАНИЕ
});

function sendCommandToServer(command) {
  const minecraftServerProcess = getServerProcess();

  if (!minecraftServerProcess || minecraftServerProcess.killed) {
    throw new Error("Сервер Minecraft не запущен.");
  }

  minecraftServerProcess.stdin.write(`${command}\n`);
  console.log(`[Command Sent]: ${command}`);
}

app.listen(PORT, () => {
  console.log(`API запущено на http://localhost:${PORT}`);
});

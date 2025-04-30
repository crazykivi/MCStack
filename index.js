const express = require("express");
const os = require("os");
const fs = require("fs-extra");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const {
  getVanillaServerUrl,
  getModsServerUrl,
  downloadFile,
} = require("./utils/downloadMinecraft");
const { downloadAndExtractJava } = require("./utils/downloadJava");
const {
  startMinecraftServer,
  acceptEULA,
  saveMinecraftServer,
  getServerProcess,
  getPlayerCount,
  getMemoryUsage,
} = require("./utils/serverManager");
const { getRequiredJavaVersion } = require("./utils/versionUtils");
const { authenticateRequest } = require("./middleware/serverAuth");
const { spawn } = require("child_process");
// const config = require("./config/config.json");
const { getConfig } = require("./utils/configLoader");
const {
  minecraftServer,
  commandOutup,
  commandError,
  commandSent,
  java,
  vanilla,
  forge,
  fabric,
} = require("./utils/logger");
const {
  getHistory,
  startResourceMonitoring,
  stopResourceMonitoring,
} = require("./utils/resourceHistory");
const minecraftVersionsRouter = require("./utils/frontend/MinecraftVersions");

const app = express();
const PORT = 3001;

function getDefaultParams(query) {
  let config = getConfig();
  const type = query.type || config.defaultServerType;
  const version = query.version || config.defaultServerVersion;
  return { type, version };
}

app.use(express.json());
app.use(cors());

// Глобальный объект для хранения состояния сервера
const serverState = {
  type: null,
  version: null,
  core: null,
};

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
  let config = getConfig();
  await fs.writeFile(
    userJvmArgsPath,
    `-Xmx${config.maxMemory} -Xms${config.minMemory}`
  );
}

async function startVanillaServer(serverDir, version, core, javaPath) {
  const serverJarPath = path.join(serverDir, "server.jar");
  const serverUrl = await getServerUrl("vanilla", version, core);
  await downloadFile(serverUrl, serverJarPath);
  vanilla("Сервер скачан:", serverJarPath);

  let config = getConfig();
  const memoryOptions = `-Xmx${config.maxMemory} -Xms${config.minMemory}`;
  const command = `${javaPath} ${memoryOptions} -jar server.jar nogui`;
  startMinecraftServer(command, serverDir);
}

async function startForgeServer(serverDir, version, core, javaPath) {
  const installerData = await getServerUrl("mods", version, core);
  const installerUrl = installerData.url;
  const installerJarPath = path.join(serverDir, "forge-installer.jar");
  await downloadFile(installerUrl, installerJarPath);

  forge("Установка Forge в headless режиме...");
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

  // Запуск сервера через run.sh
  const command = `bash ${runScript} nogui`;
  startMinecraftServer(command, serverDir);
}

async function startFabricServer(serverDir, version, core, javaPath) {
  try {
    // Получение данных об установщике Fabric
    const installerData = await getServerUrl("mods", version, core);
    const installerUrl = installerData.url;
    const installerJarPath = path.join(serverDir, "fabric-installer.jar");

    fabric(`Скачивание установщика Fabric версии ${installerData.version}...`);
    await downloadFile(installerUrl, installerJarPath);
    fabric(`Установщик Fabric успешно скачан: ${installerJarPath}`);

    // Установка Fabric через установщик
    fabric("Установка Fabric...");
    const installCommand = `${javaPath} -jar fabric-installer.jar server -dir ${serverDir} -mcversion ${version}`;
    await executeCommand(installCommand, serverDir);
    fabric("Fabric успешно установлен.");

    // Скачивание официального серверного JAR Minecraft
    const vanillaServerUrl = await getVanillaServerUrl(version);
    const serverJarPath = path.join(serverDir, "server.jar");
    fabric(
      `Скачивание официального серверного JAR Minecraft: ${vanillaServerUrl}`
    );
    await downloadFile(vanillaServerUrl, serverJarPath);
    fabric(`Серверный JAR Minecraft успешно скачан: ${serverJarPath}`);

    // Проверка наличия fabric-server-launch.jar после установки
    const serverLaunchJarPath = path.join(
      serverDir,
      "fabric-server-launch.jar"
    );
    if (!fs.existsSync(serverLaunchJarPath)) {
      throw new Error(
        "Файл fabric-server-launch.jar не найден после установки Fabric."
      );
    }

    let config = getConfig();
    // Формирование команды для запуска сервера
    const memoryOptions = `-Xmx${config.maxMemory} -Xms${config.minMemory}`;
    const command = `${javaPath} ${memoryOptions} -jar fabric-server-launch.jar nogui`;

    fabric(`Запуск сервера с командой: ${command}`);
    startMinecraftServer(command, serverDir);
  } catch (error) {
    fabric(`Ошибка при запуске Fabric-сервера: ${error.message}`);
    throw error;
  }
}

async function executeCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const [executable, ...args] = command.split(" ");
    const process = spawn(executable, args, { cwd });

    process.stdout.on("data", (data) => {
      commandOutup(`[Command Output]: ${data.toString().trim()}`);
    });

    process.stderr.on("data", (data) => {
      commandError(`[Command Error]: ${data.toString().trim()}`);
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

app.get("/start", authenticateRequest, async (req, res) => {
  const { type, version } = getDefaultParams(req.query);
  const core = req.query.core;

  try {
    const serverProcess = getServerProcess();
    if (serverProcess && !serverProcess.killed) {
      minecraftServer("Останавливаю предыдущий сервер...");
      stopServer();
    }

    await startServer(type, version, core);

    serverState.type = type;
    serverState.version = version;
    serverState.core = core;

    res.send(`Сервер Minecraft ${type} версии ${version} успешно запущен.`);
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error.message);
    res.status(500).send(`Ошибка: ${error.message}`);
  }
});

async function startServer(type, version, core = null) {
  try {
    const requiredJavaVersion = getRequiredJavaVersion(version);
    java(`Требуемая версия Java: ${requiredJavaVersion}`);

    const javaPath = await downloadAndExtractJava(requiredJavaVersion);

    let config = getConfig();
    const serverDir = path.join(
      __dirname,
      config.serverDirectory,
      `${type}-${version}`
    );
    await fs.ensureDir(serverDir);

    await prepareServerEnvironment(serverDir, type, version, core, javaPath);

    // Объекты выбора команд
    const commandHandlers = {
      vanilla: async () =>
        await startVanillaServer(serverDir, version, core, javaPath),
      mods: {
        forge: async () =>
          await startForgeServer(serverDir, version, core, javaPath),
        fabric: async () =>
          await startFabricServer(serverDir, version, core, javaPath),
      },
    };

    // Проверка типа сервера
    if (!commandHandlers[type]) {
      throw new Error(`Неизвестный тип сервера: ${type}`);
    }

    // Если mods, проверка поддерживаемого ядра
    if (type === "mods" && !commandHandlers.mods[core]) {
      throw new Error(`Неизвестное ядро для модов: ${core}`);
    }

    // Выбор и выполнение соответствующей команды
    const handler =
      type === "mods" ? commandHandlers.mods[core] : commandHandlers[type];
    const result = await handler();

    startResourceMonitoring(getServerProcess, getPlayerCount, getMemoryUsage);

    minecraftServer(
      `Сервер Minecraft ${type} версии ${version} успешно запущен.`
    );

    return result;
  } catch (error) {
    console.error(`Ошибка при запуске сервера: ${error.message}`);
    throw error;
  }
}

app.get("/stop", authenticateRequest, (req, res) => {
  const stopped = stopServer();
  if (stopped) {
    res.send("Команда stop отправлена.");
  } else {
    res.status(400).send("[Minecraft Server]: Сервер не запущен.");
  }
});

function stopServer() {
  const serverProcess = getServerProcess();
  if (!serverProcess || serverProcess.killed) {
    return false;
  }

  minecraftServer("Отправлена команда stop на сервер...");
  serverProcess.stdin.write("stop\n");
  stopResourceMonitoring();
  return true;
}

app.get("/save", authenticateRequest, (req, res) => {
  const saved = saveMinecraftServer();
  if (saved) {
    res.send("Команда save-all отправлена.");
  } else {
    res.status(400).send("[Minecraft Server]: Сервер не запущен.");
  }
});

app.get("/restart", authenticateRequest, async (req, res) => {
  let { type, version, core } = req.query;

  if (!type || !version) {
    type = serverState.type;
    version = serverState.version;
    core = serverState.core;

    if (!type || !version) {
      return res
        .status(400)
        .send(
          "Необходимо указать параметры type и version или предварительно запустить сервер."
        );
    }
  }

  try {
    const stopped = stopServer();
    if (!stopped) {
      return res.status(400).send("[Minecraft Server]: Сервер не запущен.");
    }

    await startServer(type, version, core);
    res.send(`Сервер Minecraft ${type} версии ${version} успешно перезапущен.`);
  } catch (error) {
    console.error("Ошибка при перезапуске сервера:", error.message);
    res.status(500).send(`Ошибка: ${error.message}`);
  }
});

app.get("/status", authenticateRequest, async (req, res) => {
  try {
    const serverProcess = getServerProcess();
    const isRunning = serverProcess && !serverProcess.killed;

    const playersOnline = await getPlayerCount();
    const memoryUsage = getMemoryUsage();
    const cpuLoad = os.loadavg()[0];

    res.json({
      status: isRunning ? "running" : "stopped",
      playersOnline: playersOnline,
      memoryUsage: memoryUsage,
      cpuUsage: cpuLoad.toFixed(2),
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/history", authenticateRequest, (req, res) => {
  res.json(getHistory());
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

function sendCommandToServer(command) {
  const minecraftServerProcess = getServerProcess();

  if (!minecraftServerProcess || minecraftServerProcess.killed) {
    throw new Error("Сервер Minecraft не запущен.");
  }

  minecraftServerProcess.stdin.write(`${command}\n`);
  commandSent(`[Command Sent]: ${command}`);
}

app.use("/frontend", minecraftVersionsRouter);
app.use("/auth", authRoutes);

require("./utils/websocketServer");

app.listen(PORT, () => {
  console.log(`API запущено на http://localhost:${PORT}`);
});

const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const { minecraftServer } = require("./logger");

let serverProcess = null; // Глобальная переменная для хранения процесса сервера
let currentPlayerCount = 0; // Переменная для хранения количества игроков

async function acceptEULA(serverDir) {
  const eulaPath = path.join(serverDir, "eula.txt");
  await fs.writeFile(eulaPath, "eula=true", "utf8");
  minecraftServer(`EULA принято: ${eulaPath}`);
}

function startMinecraftServer(command, workingDir) {
  const [javaPath, ...args] = command.split(" ");
  serverProcess = spawn(javaPath, args, {
    cwd: workingDir,
    stdio: ["pipe", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (data) => {
    const output = data.toString();
    minecraftServer(`${output}`);

    // Парсинг вывода для подсчета игроков
    const playerCountMatch = output.match(
      /There are (\d+)\/\d+ players online:/
    );
    if (playerCountMatch) {
      currentPlayerCount = parseInt(playerCountMatch[1], 10);
    }
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[Minecraft Server Error]: ${data.toString()}`);
  });

  serverProcess.on("close", (code) => {
    minecraftServer(`Процесс завершен с кодом ${code}`);
    serverProcess = null;
    currentPlayerCount = 0;
  });
}

function stopMinecraftServer() {
  if (!serverProcess) {
    minecraftServer("Сервер не запущен.");
    return false;
  }

  minecraftServer("Отправка команды stop...");
  serverProcess.stdin.write("stop\n");
  return true;
}

function saveMinecraftServer() {
  if (!serverProcess) {
    minecraftServer("Сервер не запущен.");
    return false;
  }

  minecraftServer("Отправка команды save-all...");
  serverProcess.stdin.write("save-all\n");
  return true;
}

function getMemoryUsage() {
  if (!serverProcess || serverProcess.killed) {
    return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
  }

  const memoryUsage = process.memoryUsage();
  return {
    rss: memoryUsage.rss, // Общий объём памяти (в байтах)
    heapTotal: memoryUsage.heapTotal, // Общий размер кучи (в байтах)
    heapUsed: memoryUsage.heapUsed, // Фактическое использование в куче (в байтах)
    external: memoryUsage.external, // Память, используемая внешними библиотеками (в байтах)
  };
}

function getServerProcess() {
  return serverProcess;
}

function getPlayerCount() {
  return new Promise((resolve, reject) => {
    const serverProcess = getServerProcess();

    if (!serverProcess || serverProcess.killed) {
      return resolve("0/0");
    }

    let resolved = false;

    const handleOutput = (data) => {
      const output = data.toString().trim();

      const playerListMatch = output.match(
        /There are (\d+) of a max of (\d+) players online:/
      );
      if (playerListMatch) {
        const currentPlayers = parseInt(playerListMatch[1], 10);
        const maxPlayers = parseInt(playerListMatch[2], 10);

        if (!resolved) {
          resolved = true;
          serverProcess.stdout.off("data", handleOutput);
          resolve(`${currentPlayers}/${maxPlayers}`);
        }
      }
    };

    serverProcess.stdout.on("data", handleOutput);

    serverProcess.stdin.write("/list\n");

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        serverProcess.stdout.off("data", handleOutput);
        resolve("0/0");
      }
    }, 5000);
  });
}

module.exports = {
  startMinecraftServer,
  acceptEULA,
  stopMinecraftServer,
  saveMinecraftServer,
  getServerProcess,
  getPlayerCount,
  getMemoryUsage,
};
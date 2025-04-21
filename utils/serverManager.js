const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

let serverProcess = null; // Глобальная переменная для хранения процесса сервера
let currentPlayerCount = 0; // Переменная для хранения количества игроков

async function acceptEULA(serverDir) {
  const eulaPath = path.join(serverDir, "eula.txt");
  await fs.writeFile(eulaPath, "eula=true", "utf8");
  console.log(`[Minecraft Server]: EULA принято: ${eulaPath}`);
}

function startMinecraftServer(command, workingDir) {
  const [javaPath, ...args] = command.split(" ");
  serverProcess = spawn(javaPath, args, {
    cwd: workingDir,
    stdio: ["pipe", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (data) => {
    const output = data.toString(); // Преобразуем данные в строку
    console.log(`[Minecraft Server]: ${output}`);

    // Парсим вывод для подсчета игроков
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
    console.log(`[Minecraft Server]: Процесс завершен с кодом ${code}`);
    serverProcess = null;
    currentPlayerCount = 0; // Сбрасываем счетчик при остановке сервера
  });
}

function stopMinecraftServer() {
  if (!serverProcess) {
    console.log("[Minecraft Server]: Сервер не запущен.");
    return false;
  }

  console.log("[Minecraft Server]: Отправка команды stop...");
  serverProcess.stdin.write("stop\n");
  return true;
}

function saveMinecraftServer() {
  if (!serverProcess) {
    console.log("[Minecraft Server]: Сервер не запущен.");
    return false;
  }

  console.log("[Minecraft Server]: Отправка команды save-all...");
  serverProcess.stdin.write("save-all\n");
  return true;
}

function saveMinecraftServer() {
  if (!serverProcess) {
    console.log("[Minecraft Server]: Сервер не запущен.");
    return false;
  }

  console.log("[Minecraft Server]: Отправка команды save-all...");
  serverProcess.stdin.write("save-all\n");
  return true;
}

function getMemoryUsage() {
  if (!serverProcess || serverProcess.killed) {
    return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
  }

  const memoryUsage = process.memoryUsage();
  return {
    rss: formatBytes(memoryUsage.rss), // Resident Set Size
    heapTotal: formatBytes(memoryUsage.heapTotal), // Общий размер кучи
    heapUsed: formatBytes(memoryUsage.heapUsed), // Используемая куча
    external: formatBytes(memoryUsage.external), // Память, используемая внешними библиотеками
  };
}

// Вспомогательная функция для форматирования байтов в читаемый вид
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Функция для получения текущего процесса сервера
function getServerProcess() {
  return serverProcess;
}

function getPlayerCount() {
  return currentPlayerCount;
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

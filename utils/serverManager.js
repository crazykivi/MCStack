const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

let serverProcess = null; // Глобальная переменная для хранения процесса сервера

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
    console.log(`[Minecraft Server]: ${data.toString()}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[Minecraft Server Error]: ${data.toString()}`);
  });

  serverProcess.on("close", (code) => {
    console.log(`[Minecraft Server]: Процесс завершен с кодом ${code}`);
    serverProcess = null;
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

module.exports = {
  startMinecraftServer,
  acceptEULA,
  stopMinecraftServer,
  saveMinecraftServer,
};

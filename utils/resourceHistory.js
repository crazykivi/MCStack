const os = require("os");
const redis = require("./redis");
const {
  getServerProcess,
  getPlayerCount,
  getMemoryUsage,
} = require("./serverManager");
const { debug, commandError } = require("./logger");
let monitoringInterval = null;

// Ключ в Redis для хранения истории ресурсов
const HISTORY_KEY = "resource_history";
// Массив колбэков для рассылки новых данных
let logListeners = [];

// Получение текущей истории из Redis
async function getHistoryFromRedis() {
  const cached = await redis.get(HISTORY_KEY);
  return cached || [];
}

// Сохранение обновленную историю в redis
async function saveHistoryToRedis(history) {
  await redis.set(HISTORY_KEY, history, 86400); // TTL 24 часа
}

// Добавляем новую запись в историю
async function addResourceData(data) {
  const timestamp = new Date().toISOString();
  const entry = { ...data, timestamp };

  let history = await getHistoryFromRedis();

  history.push(entry);

  // Удаляем записи старше 24 часов
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  history = history.filter((entry) => entry.timestamp > twentyFourHoursAgo);

  await saveHistoryToRedis(history);
  notifyLogListeners(entry);
}

// Возвращаем историю из Redis
async function getHistory() {
  return await getHistoryFromRedis();
}

function startResourceMonitoring(
  getServerProcess,
  getPlayerCount,
  getMemoryUsage,
  onNewLog
) {
  if (monitoringInterval) {
    debug("Resource monitoring is already running.");
    return;
  }

  monitoringInterval = setInterval(async () => {
    try {
      const serverProcess = getServerProcess();
      const isRunning = serverProcess && !serverProcess.killed;

      if (!isRunning) {
        stopResourceMonitoring();
        return;
      }

      const memoryUsage = getMemoryUsage();
      const cpuLoad = os.loadavg()[0];
      const logEntry = {
        status: isRunning ? "running" : "stopped",
        memoryUsage: memoryUsage,
        cpuUsage: cpuLoad.toFixed(2),
      };

      await addResourceData(logEntry);

      if (onNewLog) {
        onNewLog(logEntry);
      }

      debug(
        `Collected resource data: CPU=${cpuLoad.toFixed(
          2
        )}, Memory=${memoryUsage}`
      );
    } catch (error) {
      commandError("Error collecting resource data:", error);
    }
  }, 60 * 1000);
}

function stopResourceMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    debug("Resource monitoring stopped.");
  }
}

function addLogListener(listener) {
  if (typeof listener === "function") {
    logListeners.push(listener);
  }
}

function removeLogListener(listener) {
  logListeners = logListeners.filter((cb) => cb !== listener);
}

function notifyLogListeners(log) {
  logListeners.forEach((listener) => listener(log));
}

module.exports = {
  addResourceData,
  getHistory,
  startResourceMonitoring,
  stopResourceMonitoring,
  addLogListener,
  removeLogListener,
};
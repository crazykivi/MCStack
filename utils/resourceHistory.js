const os = require("os");
const {
  getServerProcess,
  getPlayerCount,
  getMemoryUsage,
} = require("./serverManager");
const { debug, commandError } = require("./logger");

// Объект для хранения истории данных
let resourceHistory = [];
let monitoringInterval = null;
let logListeners = []; // Массив колбэков для рассылки данных

function addResourceData(data) {
  const timestamp = new Date().toISOString();
  resourceHistory.push({ ...data, timestamp });
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  resourceHistory = resourceHistory.filter(
    (entry) => new Date(entry.timestamp) > twentyFourHoursAgo
  );

  notifyLogListeners(data);
}

function getHistory() {
  return resourceHistory;
}

function addServerLog(log) {
  const timestamp = new Date().toISOString();
  serverLogs.push({ timestamp, log });
}

function getServerLogs(startIndex = 0, count = 50) {
  return serverLogs.slice(startIndex, startIndex + count);
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
        timestamp: new Date(),
        status: isRunning ? "running" : "stopped",
        memoryUsage: memoryUsage,
        cpuUsage: cpuLoad.toFixed(2),
      };

      //   addResourceData(logEntry);
      addResourceData(logEntry);
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
  addServerLog,
  getServerLogs,
};

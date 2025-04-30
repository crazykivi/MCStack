const fs = require("fs");
const path = require("path");
const LOGGER_CONFIG_PATH = path.join(__dirname, "../config/logger.json");
let loggerConfig = loadLoggerConfig();

const configLog = createLogger("configLog");

function loadLoggerConfig() {
  try {
    const rawData = fs.readFileSync(LOGGER_CONFIG_PATH, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Ошибка при загрузке конфигурации логгера:", error.message);
    // Возврат дефолтной конфигурации, если что-то случилось с файлов logger.json
    return {
      logging: {
        enabled: true,
        debug: false,
        java: true,
        commandOutup: true,
        commandError: true,
        commandSent: true,
        minecraftServer: true,
        vanilla: true,
        forge: true,
        fabric: true,
        paper: true,
        webSocket: true,
        configLog: true,
      },
    };
  }
}

function reloadLoggerConfig() {
  configLog("Перезагрузка конфигурации логгера...");
  try {
    loggerConfig = loadLoggerConfig();
    configLog("Конфигурация логгера успешно обновлена.");
  } catch (error) {
    console.error(
      "Не удалось перезагрузить конфигурацию логгера:",
      error.message
    );
  }
}

fs.watchFile(LOGGER_CONFIG_PATH, { interval: 500 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    configLog("Файл logger.json был изменен.");
    reloadLoggerConfig();
  }
});

function createLogger(category) {
  return (message) => {
    const config = loadLoggerConfig();
    if (!config.logging.enabled) {
      return;
    }

    const categoryEnabled = config.logging[category];
    if (!categoryEnabled) {
      return;
    }

    console.log(`[${category.toUpperCase()}]: ${message}`);
  };
}

module.exports = {
  minecraftServer: createLogger("minecraftServer"),
  commandOutup: createLogger("commandOutup"),
  commandError: createLogger("commandError"),
  commandSent: createLogger("commandSent"),
  java: createLogger("java"),
  vanilla: createLogger("vanilla"),
  forge: createLogger("forge"),
  fabric: createLogger("fabric"),
  paper: createLogger("paper"),
  debug: createLogger("debug"),
  error: createLogger("error"),
  auth: createLogger("auth"),
  webSocket: createLogger("webSocket"),
  configLog: configLog,
};

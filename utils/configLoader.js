const fs = require("fs");
const path = require("path");
const { configLog } = require("./logger");
const CONFIG_PATH = path.join(__dirname, "../config/config.json");

function loadConfig() {
  try {
    const rawData = fs.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Ошибка при загрузке конфига:", error.message);
    throw error;
  }
}

let config = loadConfig();

function reloadConfig() {
  configLog("Перезагрузка конфига...");
  config = loadConfig();
  configLog("Конфиг успешно обновлен.");
}

fs.watchFile(CONFIG_PATH, { interval: 500 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    configLog("Файл был изменен.");
    try {
      reloadConfig();
    } catch (error) {
      console.error("Не удалось перезагрузить конфиг:", error.message);
    }
  }
});

module.exports = {
  getConfig: () => config,
  reloadConfig,
};

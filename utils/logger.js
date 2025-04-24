const loggerConfig = require("../config/logger.json");

function createLogger(category) {
  if (!loggerConfig.logging.enabled) {
    return () => {};
  }

  const categoryEnabled = loggerConfig.logging[category];
  if (!categoryEnabled) {
    return () => {};
  }

  return (message) => {
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
  debug: createLogger("debug"),
  error: createLogger("error"),
  auth: createLogger("auth"),
  webSocket: createLogger("webSocket"),
};
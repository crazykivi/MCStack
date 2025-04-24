const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const { webSocket } = require("./logger");
const captureTerminal = require("./terminalCapture");
const {
  getHistory,
  addLogListener,
  removeLogListener,
  addServerLog,
  getServerLogs,
} = require("./resourceHistory");

// Далее будет изменено, чтобы можно было выбирать, куда сохраняются логи
const LOGS_DIR = path.join(__dirname, "../logs");
const LOGS_FILE_PATH = path.join(LOGS_DIR, "logs.json");

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  console.log(`Папка "${LOGS_DIR}" успешно создана.`);
}

let terminalLogsBuffer = [];

try {
  const logsData = fs.readFileSync(LOGS_FILE_PATH, "utf8");
  terminalLogsBuffer = JSON.parse(logsData);
} catch (error) {
  console.warn("Логи не найдены или повреждены. Создаем новый буфер.");
  terminalLogsBuffer = [];
}

// Инициализация WebSocket-сервера
const wss = new WebSocket.Server({ port: 3002 });

const broadcastTerminalData = (message) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message: message,
  };

  terminalLogsBuffer.push(logEntry);

  if (terminalLogsBuffer.length > 200) {
    terminalLogsBuffer = terminalLogsBuffer.slice(-200);
  }

  fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(terminalLogsBuffer));

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "terminal", data: logEntry }));
    }
  });
};

captureTerminal(broadcastTerminalData);

// // Функция для отправки данных о ресурсах (CPU/ОЗУ)
// const broadcastResourceData = (resourceData) => {
//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify({ type: "resources", data: resourceData }));
//     }
//   });
// };

wss.on("connection", (ws) => {
  webSocket("WebSocket client connected");

  // 20 последних записей из терминала
  const last20Logs = terminalLogsBuffer.slice(-20);
  ws.send(JSON.stringify({ type: "terminal", data: last20Logs }));

  // Использование ресурсов
  ws.send(JSON.stringify({ type: "resources", data: getHistory() }));

  // Слушатель новых логов
  const broadcastLog = (log) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "resources", data: log }));
      }
    });
  };

  addLogListener(broadcastLog);

  ws.on("close", () => {
    webSocket("WebSocket client disconnected");
    removeLogListener(broadcastLog);
  });
});

console.log("WebSocket запущен на ws://localhost:3002");

module.exports = wss;

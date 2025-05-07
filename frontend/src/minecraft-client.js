import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const ServerConsole = () => {
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [resourceHistory, setResourceHistory] = useState([]);
  const [minecraftVersions, setMinecraftVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [serverType, setServerType] = useState("vanilla");
  const [core, setCore] = useState("");
  const [commandInput, setCommandInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState("loading"); // loading / running / stopped
  const [playerCount, setPlayerCount] = useState("0");
  const [maxPlayers, setMaxPlayers] = useState("0");

  const [disableFrontendAuth, setDisableFrontendAuth] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/frontend/minecraft-versions")
      .then((response) => response.json())
      .then((versions) => {
        setMinecraftVersions(versions);
        setSelectedVersion(versions[0]);
      })
      .catch((error) => console.error("Ошибка при загрузке версий:", error));
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRes = await fetch("http://localhost:3001/config");
        const configData = await configRes.json();
        setDisableFrontendAuth(configData.disableFrontendAuth || false);
      } catch (err) {
        console.error("Не удалось получить конфиг:", err.message);
        setDisableFrontendAuth(false);
      }
    };

    fetchConfig();
  }, []);

  const handleVersionChange = (event) => {
    setSelectedVersion(event.target.value);
  };

  useEffect(() => {
    if (serverType === "mods") {
      setCore("forge");
    }
    if (serverType === "plugins") {
      setCore("paper");
    }
  }, [serverType]);

  // Подключение к WebSocket
  useEffect(() => {
    if (disableFrontendAuth === null) return; // Ждём, пока будет загружен конфиг

    const connectWebSocket = async () => {
      let wsUrl = "ws://localhost:3002/logs";

      // Добавляем токен, если нужен
      if (!disableFrontendAuth) {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Токен не найден. Пожалуйста, войдите в систему.");
          return;
        }
        wsUrl += `?token=${token}`;
      }

      let ws;
      setIsLoading(true);

      const timeoutId = setTimeout(() => {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connection established");
        };

        ws.onmessage = (event) => {
          setIsLoading(false);
          const { type, data } = JSON.parse(event.data);

          if (type === "resources") {
            const transformedData = transformDataForCharts(data);
            setResourceHistory((prev) => {
              const updatedHistory = [...prev, ...transformedData];
              return updatedHistory.slice(-20);
            });
          }

          if (type === "playerCount") {
            setServerStatus(data.status || "stopped");
            const [currentPlayers, totalPlayers] = data.playerCount?.split(
              "/"
            ) || [0, 20];
            setPlayerCount(currentPlayers);
            setMaxPlayers(totalPlayers);
          }

          if (type === "terminal") {
            let parsedData;

            if (Array.isArray(data)) {
              parsedData = data.map((item) => ({
                timestamp: item.timestamp || new Date().toISOString(),
                message: (item.message || "").trim() || "No message",
              }));
            } else if (typeof data === "string") {
              const match = data.match(/\[(.*?)\]\s*(.*)/);
              parsedData = match
                ? { timestamp: match[1], message: match[2] }
                : { timestamp: new Date().toISOString(), message: data };
            } else {
              parsedData = {
                timestamp: data.timestamp || new Date().toISOString(),
                message: (data.message || "").trim() || "No message",
              };
            }

            setConsoleOutput((prev) => {
              const updatedOutput = Array.isArray(parsedData)
                ? [...prev, ...parsedData]
                : [...prev, parsedData];
              return updatedOutput.slice(-50);
            });
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsLoading(false);
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed");
          setIsLoading(false);
        };
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
        if (ws) ws.close();
      };
    };

    connectWebSocket();
  }, [disableFrontendAuth]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("http://localhost:3001/history");
        if (!response.ok) throw new Error("Ошибка загрузки истории");

        const history = await response.json();
        const transformedHistory = transformDataForCharts(history);
        setResourceHistory(transformedHistory);
      } catch (error) {
        console.error("Не удалось загрузить историю:", error);
      }
    };

    loadHistory();
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return "Invalid Date";
    }

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}:${month}:${year} ${hours}:${minutes}:${seconds}`;
  };

  // const transformDataForCharts = (data) => {
  //   const dataArray = Array.isArray(data) ? data : [data];

  //   const formattedData = dataArray.map((entry) => ({
  //     timestamp: new Date(entry.timestamp),
  //     displayTimestamp: formatDate(new Date(entry.timestamp)),
  //     memoryUsage: entry.memoryUsage.heapUsed / (1024 * 1024),
  //     cpuUsage: parseFloat(parseFloat(entry.cpuUsage).toFixed(3)),
  //   }));

  //   if (formattedData.length > 40) {
  //     return averageDataByInterval(formattedData, 10);
  //   }

  //   return formattedData;
  // };

  const transformDataForCharts = (data) => {
    const dataArray = Array.isArray(data) ? data : [data];

    return (
      dataArray
        // .filter((entry) => entry && typeof entry === "object") // Защита от null/undefined
        .filter((entry) => {
          return (
            entry &&
            typeof entry === "object" &&
            entry.timestamp &&
            entry.memoryUsage?.heapUsed > 0 &&
            entry.cpuUsage !== "0.00" &&
            !isNaN(new Date(entry.timestamp).getTime())
          );
        })
        .map((entry) => ({
          timestamp: new Date(entry.timestamp || Date.now()),
          displayTimestamp: formatDate(new Date(entry.timestamp || Date.now())),
          memoryUsage: (entry.memoryUsage?.heapUsed || 0) / (1024 * 1024), // MB
          cpuUsage: parseFloat(parseFloat(entry.cpuUsage || 0).toFixed(3)),
          playerCount: parseInt(entry.playerCount || 0),
        }))
    );
  };

  // const averageDataByInterval = (data, intervalMinutes = 10) => {
  //   const groupedData = {};

  //   data.forEach((entry) => {
  //     const date = new Date(entry.timestamp);
  //     const intervalStart = new Date(
  //       Math.floor(date.getTime() / (intervalMinutes * 60 * 1000)) *
  //         (intervalMinutes * 60 * 1000)
  //     );

  //     const intervalKey = intervalStart.toISOString();

  //     if (!groupedData[intervalKey]) {
  //       groupedData[intervalKey] = {
  //         timestamp: intervalStart,
  //         memoryUsageSum: 0,
  //         cpuUsageSum: 0,
  //         count: 0,
  //       };
  //     }

  //     groupedData[intervalKey].memoryUsageSum += entry.memoryUsage;
  //     groupedData[intervalKey].cpuUsageSum += entry.cpuUsage;
  //     groupedData[intervalKey].count += 1;
  //   });

  //   return Object.values(groupedData).map((group) => ({
  //     timestamp: group.timestamp,
  //     memoryUsage: parseFloat((group.memoryUsageSum / group.count).toFixed(3)),
  //     cpuUsage: parseFloat((group.cpuUsageSum / group.count).toFixed(3)),
  //   }));
  // };

  const handleStart = () => {
    const currentCore = core;
    console.log(currentCore);
    if (serverType === "mods" && !currentCore) {
      alert("Для типа 'mods' необходимо выбрать ядро (Forge).");
      return;
    }

    const queryParams = new URLSearchParams({
      type: serverType,
      version: selectedVersion,
      core: currentCore,
    }).toString();
    console.log(queryParams);
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Токен не найден. Пожалуйста, войдите в систему.");
      return;
    }

    fetch(`http://localhost:3001/start?${queryParams}`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.debug("Сервер запущен:", data);
      })
      .catch((error) => {
        console.error("Ошибка при запуске сервера:", error);
      });
  };

  const handleCommandSubmit = () => {
    if (!commandInput.trim()) {
      console.warn("Команда пуста");
      return;
    }

    const command = commandInput.trim();

    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Токен не найден. Пожалуйста, войдите в систему.");
      return;
    }

    // Зарезервированные команды, которые отправляются без command
    if (["save", "restart", "stop"].includes(command)) {
      fetch(`http://localhost:3001/${command}`, {
        method: "GET",
        headers: {
          Authorization: token,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then((data) => {
          console.log(`Команда "${command}" выполнена:`, data);
        })
        .catch((error) => {
          console.error(`Ошибка при выполнении команды "${command}":`, error);
        });
    } else {
      // Отправка произвольной команды
      fetch("http://localhost:3001/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ command }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then((data) => {
          console.log(`Команда "${command}" выполнена:`, data);
        })
        .catch((error) => {
          console.error(`Ошибка при выполнении команды "${command}":`, error);
        });
    }

    setCommandInput("");
  };

  const handleRestart = () => {
    const queryParams = new URLSearchParams({
      type: serverType,
      version: selectedVersion,
      ...(serverType === "mods" && { core }),
    }).toString();

    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Токен не найден. Пожалуйста, войдите в систему.");
      return;
    }

    fetch(`http://localhost:3001/restart?${queryParams}`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.debug("Сервер перезапущен:", data);
      })
      .catch((error) => {
        console.error("Ошибка при запуске сервера:", error);
      });
  };

  const handleStop = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Токен не найден. Пожалуйста, войдите в систему.");
      return;
    }

    fetch(`http://localhost:3001/stop`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.debug("Сервер остановлен:", data);
      })
      .catch((error) => {
        console.error("Ошибка при запуске сервера:", error);
      });
  };

  // const handleKill = () => {
  //   console.log("Kill button clicked");
  // };

  return (
    <div className="flex h-screen">
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
          <div className="loader"></div>
        </div>
      )}
      <div className="w-64 bg-gray-200 p-4">
        <ul>
          {/* <li className="py-2">
            <a href="#" className="text-blue-600">
              Настроить аккаунт
            </a>
          </li>
          <li className="py-2">
            <a href="#" className="text-blue-600">
              Панель доступа
            </a>
          </li>
          <li className="py-2">
            <a href="#" className="text-blue-600">
              API достп
            </a>
          </li>
          <li className="py-2">
            <a href="#" className="text-blue-600">
              Мои миры
            </a>
          </li> */}
          <li className="py-2">
            <a href="/dashboard" className="text-blue-600">
              Консоль
            </a>
          </li>
          <li className="py-2">
            <a href="/file-manager" className="text-blue-600">
              Файловый менеджер
            </a>
          </li>
          {/* <li className="py-2">
            <a href="#" className="text-blue-600">
              Управление задачами
            </a>
          </li>
          <li className="py-2">
            <a href="#" className="text-blue-600">
              Конфигурация
            </a>
          </li> */}
        </ul>
      </div>
      <div className="flex-1 p-4">
        <div className="bg-white p-1 mb-4">
          <h2 className="text-lg font-bold mb-1">Управление сервером</h2>
          <p className="text-gray-600 mb-1">
            Панель для управления сервером в реальном времени
          </p>
          <div className="flex justify-end mb-1">
            {/* Статус сервера и кол-во игроков */}
            {/* <div className="mr-4 text-gray-600">
              <span className="font-medium">Кол-во игроков на сервере:</span>
              {serverStatus === "stopped" ? (
                <span className="ml-2 text-red-500">Сервер выключен</span>
              ) : (
                <span className="ml-2 text-green-600">{`${playerCount} / ${maxPlayers}`}</span>
              )}
            </div> */}
            <label className="mr-2 text-gray-600">Тип сервера:</label>
            <select
              value={serverType}
              onChange={(e) => setServerType(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 mr-4"
            >
              <option value="vanilla">Vanilla</option>
              <option value="mods">Mods</option>
              <option value="plugins">Plugins</option>
            </select>
            {serverType === "mods" && (
              <>
                <label className="mr-2 text-gray-600">Ядро:</label>
                <select
                  value={core}
                  onChange={(e) => {
                    const selectedCore = e.target.value;
                    console.log("Выбранное ядро:", selectedCore);
                    setCore(selectedCore);
                  }}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value="forge">Forge</option>
                  <option value="fabric">Fabric</option>
                  {/* Другие ядра позже будут */}
                </select>
              </>
            )}

            {serverType === "plugins" && (
              <>
                <label className="mr-2 text-gray-600">Ядро:</label>
                <select
                  value={core}
                  onChange={(e) => {
                    const selectedCore = e.target.value;
                    console.log("Выбранное ядро:", selectedCore);
                    setCore(selectedCore);
                  }}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value="paper">Paper</option>
                  <option value="spigot">Spigot</option>
                </select>
              </>
            )}
            <label className="mr-2 text-gray-600">Выберите версию:</label>
            <select
              value={selectedVersion}
              onChange={handleVersionChange}
              className="border border-gray-300 rounded px-2 py-1"
            >
              {minecraftVersions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>
          {/* БЕЗ ЗАГРУЗКИ */}
          <div
            className="bg-black p-4 text-white overflow-y-auto"
            style={{ height: "430px" }}
          >
            <ul>
              {consoleOutput.map((line, index) => {
                const timestamp = line.timestamp
                  ? formatDate(new Date(line.timestamp))
                  : "Invalid Date";
                const message = (line.message || "").trim();

                return (
                  <li key={index}>
                    <span className="font-bold">{timestamp}</span> {message}
                  </li>
                );
              })}
            </ul>
          </div>
          {/* СО СЛОВОМ ЗАГРУЗКИ */}
          {/* <div
            className="bg-black p-4 text-white overflow-y-auto"
            style={{ height: "430px" }}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="loader"></div>
              </div>
            ) : (
              <ul>
                {consoleOutput.map((line, index) => {
                  const timestamp = line.timestamp
                    ? formatDate(new Date(line.timestamp))
                    : "Invalid Date";
                  const message = (line.message || "").trim();
                  return (
                    <li key={index}>
                      <span className="font-bold">{timestamp}</span> {message}
                    </li>
                  );
                })}
              </ul>
            )}
          </div> */}
          <div className="flex mt-1">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommandSubmit();
              }}
              placeholder="Введите команду..."
              className="flex-1 border border-gray-300 rounded px-2 py-1 mr-2"
            />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleCommandSubmit}
            >
              Отправить
            </button>
          </div>

          <div className="flex justify-end mt-4">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleStart}
            >
              Запустить
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-2"
              onClick={handleRestart}
            >
              Рестарт
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleStop}
            >
              Остановить
            </button>
            <button className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-4 rounded mx-2">
              Kill
            </button>
          </div>
        </div>
        <div className="flex-1 flex justify-between">
          <div className="w-1/2 p-4 bg-white">
            <h2 className="text-lg font-bold mb-2">Memory Usage</h2>
            <LineChart width={400} height={200} data={resourceHistory}>
              <CartesianGrid strokeDasharray="3 3" />

              {/* Ось X с красивым форматом даты */}
              <XAxis
                dataKey="timestamp"
                tickFormatter={(unixTime) => formatDate(new Date(unixTime))}
                interval="preserveStartEnd"
              />

              <YAxis />

              {/* Tooltip с форматированием памяти */}
              <Tooltip
                labelFormatter={(label) => formatDate(new Date(label))}
                formatter={(value, name) => {
                  if (name === "memoryUsage") {
                    return [`${formatBytes(value * 1024 * 1024)}`, "ОЗУ"];
                  }
                  return [value, name];
                }}
              />

              <Legend />
              <Line
                type="monotone"
                dataKey="memoryUsage"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </div>
          <div className="w-1/2 p-4 bg-white">
            <h2 className="text-lg font-bold mb-2">CPU Usage</h2>
            <LineChart width={400} height={200} data={resourceHistory}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="timestamp"
                tickFormatter={(unixTime) => formatDate(new Date(unixTime))}
                interval="preserveStartEnd"
              />

              <YAxis />

              <Tooltip
                labelFormatter={(label) => formatDate(new Date(label))}
              />

              <Legend />
              <Line
                type="monotone"
                dataKey="cpuUsage"
                stroke="#82ca9d"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConsole;

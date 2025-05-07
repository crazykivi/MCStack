import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ServerConsole from "./minecraft-client";
import Login from "./components/Login";
import Register from "./components/Register";
import FileManager from "./components/FileManager";
import { API_URL } from "./utils/apiConfig";

function App() {
  const [isFirstUser, setIsFirstUser] = useState(null);
  const [disableFrontendAuth, setDisableFrontendAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Запрос на проверку, есть ли авторизация или нет
        const configRes = await fetch(`${API_URL}/config`);
        const configData = await configRes.json();
        setDisableFrontendAuth(configData.disableFrontendAuth || false);

        // Проверка первого пользователя
        const userRes = await fetch(`${API_URL}/auth/check-first-user`);
        const userData = await userRes.json();
        setIsFirstUser(userData.isFirstUser);
      } catch (error) {
        console.error("Ошибка инициализации:", error.message);
        setIsFirstUser(false);
        setDisableFrontendAuth(false); // По умолчанию авторизация включена
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  // Если авторизация отключена — панель доступна без аутентификации
  if (disableFrontendAuth) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ServerConsole />} />
          <Route path="/file-manager" element={<FileManager />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    );
  }

  // Стандартная логика с авторизацией
  return (
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        {isFirstUser && <Route path="/register" element={<Register />} />}
        <Route path="/login" element={<Login />} />

        {/* Защищенные маршруты */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <ServerConsole /> : <Navigate to="/login" />}
        />
        <Route
          path="/file-manager"
          element={isAuthenticated ? <FileManager /> : <Navigate to="/login" />}
        />

        {/* Перенаправление с корня */}
        <Route
          path="/"
          element={
            isFirstUser ? (
              <Navigate to="/register" />
            ) : isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
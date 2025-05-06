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

function App() {
  const [isFirstUser, setIsFirstUser] = useState(null);

  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/auth/check-first-user"
        );
        if (!response.ok) {
          throw new Error("Ошибка при проверке первого пользователя.");
        }
        const data = await response.json();
        setIsFirstUser(data.isFirstUser);
      } catch (error) {
        console.error(
          "Ошибка при проверке первого пользователя:",
          error.message
        );
        setIsFirstUser(false);
      }
    };

    checkFirstUser();
  }, []);

  const isAuthenticated = !!localStorage.getItem("token");

  if (isFirstUser === null) {
    return <div>Загрузка...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        {isFirstUser && <Route path="/register" element={<Register />} />}
        <Route path="/login" element={<Login />} />

        {/* Защищенные маршруты */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <ServerConsole /> : <Navigate to="/login" />
          }
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
      </Routes>
    </Router>
  );
}

export default App;

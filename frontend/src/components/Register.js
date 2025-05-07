import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/apiConfig";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        alert("Пользователь успешно создан!");
        navigate("/login"); // Перенаправляем на страницу входа
      } else {
        const errorData = await response.text();
        alert(`Ошибка: ${errorData}`);
      }
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      alert("Произошла ошибка. Попробуйте позже.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded shadow-md"
      >
        <h2 className="text-2xl font-bold mb-4">
          Создание первого пользователя
        </h2>
        <div className="mb-4">
          <label className="block text-gray-700">Имя пользователя</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Создать
        </button>
      </form>
    </div>
  );
};

export default Register;

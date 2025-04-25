require("dotenv").config();
const { auth } = require("../utils/logger");
const bcrypt = require("bcrypt");
const {
  createUser,
  getUserByUsername,
  verifyPassword,
  getUserByToken,
  getUserCount,
  updateUserToken,
} = require("../utils/db");

async function authenticateRequest(req, res, next) {
  const token = req.headers.authorization || req.body.token;

  if (!token) {
    auth("Токен не предоставлен.");
    return res.status(401).send("Ошибка: Необходимо пройти аутентификацию.");
  }

  try {
    const user = await getUserByToken(token);
    if (!user) {
      auth("Неверный токен.");
      return res.status(401).send("Ошибка: Неверный токен.");
    }

    req.user = user;
    auth(`Аутентификация успешна для пользователя ${user.username}.`);
    return next();
  } catch (error) {
    console.error("Ошибка при аутентификации:", error.message);
    return res.status(500).send("Ошибка сервера.");
  }
}

module.exports = { authenticateRequest };

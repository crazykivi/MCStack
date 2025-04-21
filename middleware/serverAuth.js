require('dotenv').config();
const { auth } = require("../utils/logger")

function authenticateRequest(req, res, next) {
  const requiredPassword = process.env.API_PASSWORD;

  if (!requiredPassword) {
    // console.log("Аутентификация отключена (пароль не задан).");
    return next();
  }

  const providedPassword = req.headers.authorization;

  if (providedPassword === requiredPassword) {
    auth("Аутентификация успешна.");
    return next();
  }

  auth("Аутентификация не пройдена.");
  return res.status(401).send("Ошибка: Необходимо пройти аутентификацию.");
}

module.exports = { authenticateRequest };
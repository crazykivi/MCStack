require('dotenv').config();

function authenticateRequest(req, res, next) {
  const requiredPassword = process.env.API_PASSWORD;

  if (!requiredPassword) {
    // console.log("[Auth]: Аутентификация отключена (пароль не задан).");
    return next();
  }

  const providedPassword = req.headers.authorization;

  if (providedPassword === requiredPassword) {
    console.log("[Auth]: Аутентификация успешна.");
    return next();
  }

  console.log("[Auth]: Аутентификация не пройдена.");
  return res.status(401).send("Ошибка: Необходимо пройти аутентификацию.");
}

module.exports = { authenticateRequest };
const express = require("express");
const router = express.Router();
const db = require("../utils/db");
const jwt = require("jsonwebtoken");
const { auth } = require("../utils/logger");

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .send("Необходимо указать имя пользователя и пароль.");
  }

  try {
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res
        .status(400)
        .send("Пользователь с таким именем уже существует.");
    }

    await db.createUser(username, password);
    auth(`Пользователь ${username} успешно зарегистрирован.`);
    res.send("Пользователь создан.");
  } catch (error) {
    console.error("Ошибка при регистрации:", error.message);
    res.status(500).send("Ошибка сервера.");
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .send("Необходимо указать имя пользователя и пароль.");
  }

  try {
    const user = await db.getUserByUsername(username);
    if (!user || !(await db.verifyPassword(user, password))) {
      return res.status(401).send("Неверное имя пользователя или пароль.");
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    await db.updateUserToken(user.id, token);

    auth(`Пользователь ${username} успешно вошёл.`);
    res.json({ token });
  } catch (error) {
    console.error("Ошибка при входе:", error.message);
    res.status(500).send("Ошибка сервера.");
  }
});

router.get("/check-first-user", async (req, res) => {
  try {
    const userCount = await db.getUserCount();

    if (userCount === 0) {
      return res.json({ isFirstUser: true });
    }

    res.json({ isFirstUser: false });
  } catch (error) {
    console.error("Ошибка при проверке первого пользователя:", error.message);
    res.status(500).send("Ошибка сервера.");
  }
});

module.exports = router;

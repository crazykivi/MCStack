const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath =
  process.env.DATABASE_PATH || path.join(__dirname, "../data/users.db");

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      token TEXT
    )
  `);
});

async function createUser(username, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, passwordHash],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

async function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

async function getUserByToken(token) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE token = ?", [token], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function getUserCount() {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
      if (err) return reject(err);
      resolve(row.count);
    });
  });
}

async function updateUserToken(userId, token) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE users SET token = ? WHERE id = ?",
      [token, userId],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
}

module.exports = {
  db,
  createUser,
  getUserByUsername,
  verifyPassword,
  getUserByToken,
  getUserCount,
  updateUserToken,
};

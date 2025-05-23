const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const router = express.Router();
const {
  authenticateRequest
} = require("../middleware/serverAuth");
const redisClient = require("../utils/redis");
const {
  redis
} = require("../utils/logger");
const multer = require("multer");

const SERVER_DIR = "/app/server";

// function normalizePath(input) {
//   if (!input) return "";
//   return input.split("/").filter(Boolean).join("/");
// }
function normalizePath(input) {
  if (!input) return "";
  return input.replace(/\\/g, "/").split("/").filter(Boolean).join("/");
}

async function getFolderSize(folderPath) {
  const cacheKey = folderPath;
  const cachedSize = await redisClient.get(cacheKey);

  if (cachedSize !== null) {
    redis(`Размер из кэша: ${cacheKey} → ${cachedSize}`);
    return cachedSize;
  }

  let totalSize = 0;
  const files = await fs.readdir(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = await fs.lstat(filePath);

    if (stat.isDirectory()) {
      totalSize += await getFolderSize(filePath);
    } else {
      totalSize += stat.size;
    }
  }

  // Сохранение результата в Redis на 5 минут
  await redisClient.set(cacheKey, totalSize);

  return totalSize;
}

// Получение содержимого директории
router.get("/list", authenticateRequest, async (req, res) => {
  // const requestedPath = req.query.path || "";
  // const fullPath = path.resolve(SERVER_DIR, requestedPath);
  const relativePath = normalizePath(req.query.path);
  const fullPath = path.join(SERVER_DIR, relativePath);

  // Защита от выхода за пределы SERVER_DIR
  if (!fullPath.startsWith(SERVER_DIR)) {
    return res
      .status(403)
      .json({
        error: "Запрещено выходить за пределы директории"
      });
  }

  try {
    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({
        error: "Директория не найдена"
      });
    }

    const files = await fs.readdir(fullPath);
    const stats = await Promise.all(
      files.map(async (file) => {
        const fileFullPath = path.join(fullPath, file);
        const stat = await fs.lstat(fileFullPath);
        return {
          name: file,
          isDirectory: stat.isDirectory(),
          size: stat.size,
          mtime: stat.mtime,
        };
      })
    );

    let folderSize = 0;
    if (relativePath === "") {
      folderSize = await getFolderSize(fullPath);
    }

    res.json({
      files: stats,
      folderSize,
    });
  } catch (err) {
    console.error("Ошибка чтения директории:", err.message);
    res
      .status(500)
      .json({
        error: "Ошибка чтения директории",
        details: err.message
      });
  }
});

// Создание папки
router.post("/mkdir", authenticateRequest, async (req, res) => {
  const dir = path.resolve(SERVER_DIR, req.body.path);
  if (!dir.startsWith(SERVER_DIR)) return res.status(403).send("Запрещено");

  try {
    await fs.ensureDir(dir);
    await invalidateFolderSizeCache(path.relative(SERVER_DIR, dir));
    res.send("Папка создана");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Удаление файлов или папки
router.delete("/delete", authenticateRequest, async (req, res) => {
  const filePath = path.resolve(SERVER_DIR, req.body.path);
  if (!filePath.startsWith(SERVER_DIR))
    return res.status(403).send("Запрещено");

  try {
    await fs.remove(filePath);

    const folderPath = path.dirname(filePath);
    await invalidateFolderSizeCache(path.relative(SERVER_DIR, folderPath));
    res.send("Файл удален");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Скачать файл
router.get("/download", authenticateRequest, (req, res) => {
  const filePath = path.resolve(SERVER_DIR, req.query.path);
  if (!filePath.startsWith(SERVER_DIR))
    return res.status(403).send("Запрещено");

  res.download(filePath);
});

// const upload = multer();
const storage = multer.memoryStorage();
const upload = multer({
  storage
});

// Загрузить файл
// router.post(
//   "/upload",
//   authenticateRequest,
//   upload.single("file"),
//   async (req, res) => {
//     const dir = path.resolve(SERVER_DIR, req.body.path);
//     if (!dir.startsWith(SERVER_DIR)) return res.status(403).send("Запрещено");

//     const file = req.file;
//     if (!file) return res.status(400).send("Файл не найден");

//     const filePath = path.join(dir, file.originalname);

//     try {
//       await fs.writeFile(filePath, file.buffer);
//       res.send("Файл загружен");
//     } catch (err) {
//       res.status(500).send("Ошибка сохранения файла");
//     }
//   }
// );
router.post(
  "/upload",
  authenticateRequest,
  upload.array("file"),
  async (req, res) => {
    const requestedDir = req.body.path;
    const fullPath = path.resolve(SERVER_DIR, requestedDir);

    if (!fullPath.startsWith(SERVER_DIR)) {
      return res.status(403).send("Запрещено");
    }

    let relativePaths = [];
    try {
      relativePaths = JSON.parse(req.body.relativePaths);
    } catch (e) {
      return res.status(400).send("Неверный формат relativePaths");
    }

    if (!Array.isArray(relativePaths)) {
      return res.status(400).send("relativePaths должен быть массивом");
    }

    try {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const relativePath = relativePaths[i];
        const fileName = path.basename(relativePath);
        const dirStructure = path.dirname(relativePath);
        const targetDir = path.join(fullPath, dirStructure);

        if (await fs.pathExists(targetDir)) {
          const stats = await fs.lstat(targetDir);
          if (stats.isFile()) {
            await fs.unlink(targetDir);
          }
        }

        await fs.mkdir(targetDir, {
          recursive: true
        });

        const filePath = path.join(targetDir, fileName);
        await fs.writeFile(filePath, file.buffer);
      }

      res.send("Файлы успешно загружены");
    } catch (err) {
      console.error("Ошибка сохранения файлов:", err.message);
      res.status(500).send("Ошибка сохранения файлов");
    }
  }
);

// Переименование файла или папки
router.post("/rename", authenticateRequest, async (req, res) => {
  const {
    oldPath,
    newPath
  } = req.body;

  if (!oldPath || !newPath) {
    return res.status(400).json({
      error: "Не указаны пути"
    });
  }

  const fullOldPath = path.resolve(SERVER_DIR, normalizePath(oldPath));
  const fullNewPath = path.resolve(SERVER_DIR, normalizePath(newPath));

  if (!fullOldPath.startsWith(SERVER_DIR) || !fullNewPath.startsWith(SERVER_DIR)) {
    return res.status(403).json({
      error: "Запрещено выходить за пределы директории"
    });
  }

  try {
    if (!(await fs.pathExists(fullOldPath))) {
      return res.status(404).json({
        error: "Файл или папка не найдены"
      });
    }

    if (await fs.pathExists(fullNewPath)) {
      return res.status(409).json({
        error: "Файл или папка с таким именем уже существует"
      });
    }

    await fs.rename(fullOldPath, fullNewPath);

    const oldFolderPath = path.dirname(fullOldPath);
    const newFolderPath = path.dirname(fullNewPath);

    await invalidateFolderSizeCache(path.relative(SERVER_DIR, oldFolderPath));
    await invalidateFolderSizeCache(path.relative(SERVER_DIR, newFolderPath));

    res.json({
      message: "Успешно переименовано"
    });
  } catch (err) {
    console.error("Ошибка при переименовании:", err.message);
    res.status(500).json({
      error: "Ошибка при переименовании",
      details: err.message
    });
  }
});

// Поиск файлов по имени (В будущем будет реализован поиск на фронт)
// router.get("/search", authenticateRequest, async (req, res) => {
//   const relativePath = normalizePath(req.query.path);
//   const fullPath = path.join(SERVER_DIR, relativePath);
//   const searchQuery = req.query.query?.toLowerCase();

//   if (!fullPath.startsWith(SERVER_DIR)) {
//     return res
//       .status(403)
//       .json({ error: "Запрещено выходить за пределы директории" });
//   }

//   if (!searchQuery) {
//     return res.json({ files: [] });
//   }

//   try {
//     let results = [];

//     const searchRecursively = async (dir) => {
//       const files = await fs.readdir(dir);

//       for (const file of files) {
//         const filePath = path.join(dir, file);
//         const stat = await fs.lstat(filePath);

//         if (file.toLowerCase().includes(searchQuery)) {
//           results.push({
//             name: file,
//             isDirectory: stat.isDirectory(),
//             size: stat.size,
//             mtime: stat.mtime,
//             path: path.relative(SERVER_DIR, dir),
//           });
//         }

//         if (stat.isDirectory()) {
//           await searchRecursively(filePath);
//         }
//       }
//     };

//     await searchRecursively(fullPath);

//     res.json({ files: results });
//   } catch (err) {
//     console.error("Ошибка поиска:", err.message);
//     res.status(500).json({ error: "Ошибка поиска файлов" });
//   }
// });

// Редактирование файла
router.post("/edit", authenticateRequest, async (req, res) => {
  const {
    path: requestedPath,
    content
  } = req.body;

  if (!requestedPath) {
    return res.status(400).json({
      error: "Путь не указан"
    });
  }

  const relativePath = normalizePath(requestedPath);
  const filePath = path.join(SERVER_DIR, relativePath);

  if (!filePath.startsWith(SERVER_DIR)) {
    return res.status(403).json({
      error: "Запрещено"
    });
  }

  try {
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({
        error: "Файл не найден"
      });
    }

    const stat = await fs.lstat(filePath);
    if (stat.isDirectory()) {
      return res.status(400).json({
        error: "Невозможно редактировать папку"
      });
    }

    await fs.writeFile(filePath, content, "utf8");

    const folderPath = path.dirname(filePath);
    await invalidateFolderSizeCache(path.relative(SERVER_DIR, folderPath));

    res.sendStatus(200);
  } catch (err) {
    console.error("Ошибка при редактировании файла:", err.message);
    res.status(500).json({
      error: "Ошибка при сохранении файла"
    });
  }
});

// Отчистка размера кэша
async function invalidateFolderSizeCache(folderPath) {
  const absPath = path.resolve(SERVER_DIR, folderPath);
  if (!absPath.startsWith(SERVER_DIR)) return;

  const relativePath = path.relative(SERVER_DIR, absPath);
  let current = "";
  const parts = relativePath.split(path.sep).filter(Boolean);

  for (const part of parts) {
    current = path.join(current, part);
    await redisClient.delete(current);
  }

  await redisClient.delete(relativePath);
}

module.exports = router;
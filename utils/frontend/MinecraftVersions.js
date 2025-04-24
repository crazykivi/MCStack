const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/minecraft-versions", async (req, res) => {
  try {
    const manifestUrl =
      "https://launchermeta.mojang.com/mc/game/version_manifest.json";
    const { data: manifest } = await axios.get(manifestUrl);

    // Это вывод вообще всех версий
    // const versions = manifest.versions.map((v) => v.id);
    // res.json(versions);

    // Это вывод только стабильных версии (type === "release")
    const stableVersions = manifest.versions
      .filter((v) => v.type === "release") 
      .map((v) => v.id);

    res.json(stableVersions);
  } catch (error) {
    console.error("Ошибка при получении версий Minecraft:", error);
    res.status(500).json({ error: "Не удалось получить версии Minecraft" });
  }
});

module.exports = router;

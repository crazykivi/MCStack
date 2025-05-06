const axios = require("axios");
const { debug, error } = require("../logger");

async function getSpigotVersion(minecraftVersion) {
  const baseDownloadUrl = "https://s3.mcjars.app/spigot";

  // Ссылка на список сборок (может отличаться в будущем)
  const metadataUrl = `https://mcjars.app/api/v1/project/spigot/versions/${minecraftVersion}`;

  debug(`Запрашиваем информацию о Spigot для версии ${minecraftVersion}: ${metadataUrl}`);

  try {
    const response = await axios.get(metadataUrl);

    // Проверяем, есть ли доступные версии
    const versions = response.data.versions;
    if (!versions || versions.length === 0) {
      throw new Error("Нет доступных сборок Spigot для этой версии.");
    }

    // Берем первую (предположительно последнюю) из списка (обычно они идут от новой к старой)
    const latestVersion = versions[0]; // Может быть ID или номером сборки
    const downloadUrl = `${baseDownloadUrl}/${minecraftVersion}/${latestVersion}/server.jar`;
    const fileName = `spigot-${minecraftVersion}-${latestVersion}.jar`;

    debug(`Скачивание Spigot: ${fileName}`);
    return {
      url: downloadUrl,
      version: latestVersion.toString(),
      fileName: fileName,
    };
  } catch (err) {
    error(`Ошибка при получении данных о Spigot: ${err.message}`);
    throw new Error(
      `Не удалось получить данные о версии Spigot для Minecraft ${minecraftVersion}`
    );
  }
}

module.exports = { getSpigotVersion };
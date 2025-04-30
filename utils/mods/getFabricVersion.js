const axios = require("axios");
const { debug, error } = require("../logger");

async function getPaperVersion(minecraftVersion) {
  const apiUrl = `https://papermc.io/api/v2/projects/paper/versions/${minecraftVersion}/builds/latest`;

  debug(`Получение последней сборки Paper для версии ${minecraftVersion}`);
  try {
    const response = await axios.get(apiUrl);
    const latestBuild = response.data.build;
    const fileName = `paper-${minecraftVersion}-${latestBuild}.jar`;
    const downloadUrl = `https://papermc.io/api/v2/projects/paper/versions/${minecraftVersion}/builds/${latestBuild}/downloads/${fileName}`;

    return {
      url: downloadUrl,
      version: latestBuild.toString(),
      fileName: fileName,
    };
  } catch (err) {
    error(`Ошибка при получении данных о Paper: ${err.message}`);
    throw new Error(`Не удалось получить данные о Paper для версии ${minecraftVersion}`);
  }
}

module.exports = { getPaperVersion };
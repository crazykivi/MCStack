const axios = require("axios");
const { debug, error } = require("../logger");

async function getPaperVersion(minecraftVersion) {
  const buildsUrl = `https://api.papermc.io/v2/projects/paper/versions/${minecraftVersion}/builds`;

  debug(`Запрашиваем сборки Paper для версии ${minecraftVersion}: ${buildsUrl}`);

  try {
    const response = await axios.get(buildsUrl);
    const builds = response.data.builds;

    if (!builds || builds.length === 0) {
      throw new Error("Нет доступных сборок для этой версии.");
    }

    // Поиск стабильной сборки
    let stableBuilds = builds.filter((build) => build.channel === "default");

    if (stableBuilds.length === 0) {
      debug(`Стабильных сборок для ${minecraftVersion} не найдено.`);
      stableBuilds = builds;
    }

    // Использование последней сборки
    const latestBuild = stableBuilds[stableBuilds.length - 1];
    const buildNumber = latestBuild.build;
    const fileName = `paper-${minecraftVersion}-${buildNumber}.jar`;
    const downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${minecraftVersion}/builds/${buildNumber}/downloads/${fileName}`;

    debug(`Найдена последняя сборка: ${fileName}`);
    return {
      url: downloadUrl,
      version: buildNumber.toString(),
      fileName: fileName,
    };
  } catch (err) {
    error(`Ошибка при получении данных о Paper: ${err.message}`);
    throw new Error(
      `Не удалось получить данные о версии Paper для Minecraft ${minecraftVersion}`
    );
  }
}

module.exports = { getPaperVersion };
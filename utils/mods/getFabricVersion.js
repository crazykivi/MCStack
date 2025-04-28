const axios = require("axios");
const { debug, error } = require("../logger");

async function getFabricVersion(minecraftVersion) {
  const fabricMavenUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-installer/maven-metadata.xml`;

  debug(`Запрос к Fabric Maven для версии ${minecraftVersion}: ${fabricMavenUrl}`);

  try {
    // Получение метаданных Maven
    const { data: mavenMetadata } = await axios.get(fabricMavenUrl);

    // Парсинг XML метаданных
    const latestVersion = mavenMetadata.match(/<latest>(.*?)<\/latest>/)[1];
    if (!latestVersion) {
      throw new Error("Не удалось найти последнюю версию Fabric Installer.");
    }

    debug(`Найдена последняя версия Fabric Installer: ${latestVersion}`);

    // Формирование URL для скачивания установщика
    const installerUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-installer/${latestVersion}/fabric-installer-${latestVersion}.jar`;
    return { url: installerUrl, version: latestVersion };
  } catch (err) {
    error(`Ошибка при получении данных о версии Fabric: ${err.message}`);
    throw new Error(
      `Не удалось получить данные о версии Fabric для Minecraft ${minecraftVersion}.`
    );
  }
}

module.exports = { getFabricVersion };
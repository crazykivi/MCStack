const axios = require("axios");
const cheerio = require("cheerio");
const { debug, error } = require("../logger")

async function getForgeVersion(minecraftVersion) {
  const forgeUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/index_${minecraftVersion}.html`;

  debug(
    `Запрос к Forge для версии ${minecraftVersion}: ${forgeUrl}`
  );

  try {
    const { data: html } = await axios.get(forgeUrl);

    const $ = cheerio.load(html);

    const rawLink = $("a[href*='installer.jar']").first().attr("href");
    if (!rawLink) {
      throw new Error(
        `Не удалось найти версию Forge для Minecraft ${minecraftVersion}.`
      );
    }

    const realLink = extractRealLink(rawLink);

    const forgeVersionMatch = realLink.match(
      /forge\/(\d+\.\d+\.\d+)-(\d+\.\d+\.\d+)/
    );
    if (!forgeVersionMatch) {
      throw new Error(`Не удалось извлечь версию Forge из URL: ${realLink}`);
    }

    const forgeVersion = forgeVersionMatch[2];
    debug(`Найдена версия Forge: ${forgeVersion}`);
    return { url: realLink, version: forgeVersion };
  } catch (error) {
    error(
      `Ошибка при получении данных о версии Forge: ${error.message}`
    );
    throw new Error(
      `Не удалось получить данные о версии Forge для Minecraft ${minecraftVersion}.`
    );
  }
}

function extractRealLink(link) {
  const match = link.match(
    /url=(https:\/\/maven\.minecraftforge\.net\/.+?\.jar)/
  );
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return link;
}

module.exports = { getForgeVersion };

const axios = require("axios");
const fs = require("fs-extra");

const { getForgeVersion } = require("./mods/getForgeVersion.js");
const { getFabricVersion } = require("./mods/getFabricVersion.js");
const { getPaperVersion } = require("./plugins/getPaperVersion");
const { getSpigotVersion } = require("./plugins/getSpigotVersion");
const { debug, forge, fabric } = require("./logger");

async function downloadFile(url, destination) {
  if (!isValidUrl(url)) {
    throw new Error(`Некорректный URL для скачивания: ${url}`);
  }

  const writer = fs.createWriteStream(destination);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

async function getVanillaServerUrl(version) {
  const manifestUrl =
    "https://launchermeta.mojang.com/mc/game/version_manifest.json";
  const { data: manifest } = await axios.get(manifestUrl);

  const versionInfo = manifest.versions.find((v) => v.id === version);
  if (!versionInfo) throw new Error(`Версия ${version} не найдена.`);

  const { data: versionMeta } = await axios.get(versionInfo.url);
  if (!versionMeta.downloads || !versionMeta.downloads.server) {
    throw new Error(`Ссылка на server.jar для версии ${version} не найдена.`);
  }

  return versionMeta.downloads.server.url;
}

async function getModsServerUrl(version, core) {
  debug(
    `Вызов getModsServerUrl с параметрами: version=${version}, core=${core}`
  );
  switch (core) {
    case "forge":
      const forgeData = await getForgeVersion(version);
      const forgeUrl = forgeData.url;
      forge(`Формируемый URL: ${forgeUrl}`);
      return forgeData;

    case "fabric":
      const fabricData = await getFabricVersion(version);
      const fabricUrl = fabricData.url;
      fabric(`Формируемый URL: ${fabricUrl}`);
      return fabricData;
  }
}

async function getPluginsServerUrl(version, core) {
  debug(
    `Вызов getPluginsServerUrl с параметрами: version=${version}, core=${core}`
  );

  switch (core) {
    case "paper":
      const paperData = await getPaperVersion(version);
      debug(`Формируемый URL (Paper): ${paperData.url}`);
      return paperData;
    case "spigot":
      const spigotData = await getSpigotVersion(version);
      debug(`Формируемый URL (Paper): ${spigotData.url}`);
      return spigotData;

    default:
      throw new Error(`Ядро "${core}" не поддерживается для типа plugins.`);
  }
}

module.exports = {
  getVanillaServerUrl,
  getModsServerUrl,
  getPluginsServerUrl,
  downloadFile,
};

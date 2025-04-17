const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function downloadFile(url, destination) {
  const response = await axios({
    url,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(destination);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

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

async function getModsServerUrl(version) {
  const forgeUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/index_${version}.html`;
  throw new Error("Логика для скачивания mods еще не реализована.");
}

async function getPluginsServerUrl(version) {
  const paperUrl = `https://papermc.io/api/v2/projects/paper/versions/${version}/builds/latest/downloads/paper-${version}-latest.jar`;
  return paperUrl;
}

module.exports = { getVanillaServerUrl, downloadFile };

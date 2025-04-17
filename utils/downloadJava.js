const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const tar = require("tar");
const os = require("os");

async function cleanupOldJava() {
  const tempDir = os.tmpdir();
  const javaDirs = (await fs.readdir(tempDir))
    .filter((file) => file.startsWith("java-"))
    .map((file) => path.join(tempDir, file));

  for (const dir of javaDirs) {
    try {
      await fs.remove(dir);
      console.log(`[Cleanup]: Удалена старая версия Java: ${dir}`);
    } catch (error) {
      console.error(`[Cleanup]: Не удалось удалить ${dir}: ${error.message}`);
    }
  }
}

async function downloadAndExtractJava(version) {
  const url = `https://api.adoptium.net/v3/binary/latest/${version}/ga/linux/x64/jdk/hotspot/normal/adoptium?project=jdk`;
  const tempDir = path.join(os.tmpdir(), `java-${version}`);
  const javaPath = path.join(tempDir, "bin/java");

  // Проверка существующей версии Java, если она совпадает с нужной, то скип удаления и скачивания
  if (await fs.pathExists(javaPath)) {
    console.log(`[Java]: Версия ${version} уже скачана: ${tempDir}`);
    return javaPath;
  }

  console.log(`[Java]: Скачивание версии ${version}...`);
  await cleanupOldJava(version);

  await fs.ensureDir(tempDir);

  const response = await axios({
    url,
    responseType: "stream",
  });

  const archivePath = path.join(tempDir, "java.tar.gz");
  const writer = fs.createWriteStream(archivePath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  await tar.x({
    file: archivePath,
    cwd: tempDir,
    strip: 1,
  });

  await fs.remove(archivePath);

  console.log(`Java ${version} скачана и распакована в ${tempDir}`);
  return javaPath;
}

module.exports = { downloadAndExtractJava };

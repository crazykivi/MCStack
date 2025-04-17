function isVersionGreaterOrEqual(version, compareTo) {
  const [major1, minor1, patch1] = version.split(".").map(Number);
  const [major2, minor2, patch2] = compareTo.split(".").map(Number);

  if (major1 > major2) return true;
  if (major1 === major2 && minor1 > minor2) return true;
  if (major1 === major2 && minor1 === minor2 && patch1 >= patch2) return true;
  return false;
}

function getRequiredJavaVersion(minecraftVersion) {
  if (isVersionGreaterOrEqual(minecraftVersion, "1.20.5")) {
    return 21;
  } else if (isVersionGreaterOrEqual(minecraftVersion, "1.18")) {
    return 17;
  } else if (isVersionGreaterOrEqual(minecraftVersion, "1.17")) {
    return 16;
  } else if (isVersionGreaterOrEqual(minecraftVersion, "1.13")) {
    return 8;
  } else {
    return 8;
  }
}

module.exports = { getRequiredJavaVersion };

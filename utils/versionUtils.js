function getRequiredJavaVersion(minecraftVersion) {
  // Правила соответствия версий Minecraft и Java
  const javaVersionRules = [
    { minecraft: "1.20.5", java: 21 },
    { minecraft: "1.18", java: 17 },
    { minecraft: "1.17", java: 16 },
    { minecraft: "1.13", java: 8 },
  ];

  // Ищем первое правило, которое соответствует версии Minecraft
  for (const rule of javaVersionRules) {
    if (isVersionGreaterOrEqual(minecraftVersion, rule.minecraft)) {
      return rule.java;
    }
  }

  // Если версия Minecraft не соответствует ни одному правилу, возвращаем Java 8
  return 8;
}

// Вспомогательная функция для сравнения версий
function isVersionGreaterOrEqual(version, compareTo) {
  const [major1, minor1, patch1] = version.split(".").map(Number);
  const [major2, minor2, patch2] = compareTo.split(".").map(Number);

  if (major1 > major2) return true;
  if (major1 === major2 && minor1 > minor2) return true;
  if (major1 === major2 && minor1 === minor2 && patch1 >= patch2) return true;
  return false;
}

module.exports = { getRequiredJavaVersion };

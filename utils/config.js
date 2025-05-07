export const getFrontendConfig = async () => {
  try {
    const res = await fetch("http://localhost:3001/config");
    if (!res.ok) throw new Error("Не удалось загрузить конфиг");
    return await res.json();
  } catch (error) {
    console.error("Ошибка загрузки конфига:", error.message);
    return {};
  }
};

function getCacheKey(path) {
  return `folder_size:${path}`;
}

module.exports = { getCacheKey };

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
const WS_URL = API_URL
  .replace(/^https?:\/\//, 'ws://')
  .replace(/\:\d+/, '')
  + ":3002/logs";

export { API_URL, WS_URL };

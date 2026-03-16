const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)
  ?.trim()
  .replace(/\/$/, "");

const API_URL =
  configuredApiUrl ||
  (import.meta.env.DEV ? "http://localhost:5000/api/v1" : "/api/v1");
export default API_URL;

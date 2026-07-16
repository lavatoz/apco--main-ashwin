import { API_URL } from "../services/api";

export function getFullUrl(url?: string): string {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const base = API_URL.replace(/\/$/, "");

  if (url.startsWith("/api") && base.endsWith("/api")) {
    return `${base.slice(0, -4)}${url}`;
  }

  const path = url.startsWith("/") ? url : `/${url}`;

  return `${base}${path}`;
}

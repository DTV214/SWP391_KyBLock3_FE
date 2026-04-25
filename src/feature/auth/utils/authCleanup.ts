import { chatRealtimeService } from "@/feature/chat/services/chatRealtime";

const AUTH_STORAGE_KEYS = ["token", "user", "role"];

const expireCookie = (name: string, path: string, domain?: string) => {
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}`;
};

const clearReadableCookies = () => {
  if (typeof document === "undefined") return;

  const hostParts = window.location.hostname.split(".");
  const domains = new Set<string | undefined>([undefined, window.location.hostname]);

  if (hostParts.length > 1) {
    domains.add(`.${hostParts.slice(-2).join(".")}`);
  }

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (!name) return;

    domains.forEach((domain) => {
      expireCookie(name, "/", domain);
      expireCookie(name, window.location.pathname || "/", domain);
    });
  });
};

export const clearAuthState = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  clearReadableCookies();
  void chatRealtimeService.disconnect();
};

import { logger } from "@/utils/logger";
import type { PaletteMode } from "@mui/material/styles";

/**
 * Client-side theme detection utility
 * Gets theme from localStorage or system preference
 */
export function getClientTheme(): PaletteMode {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    // Check localStorage first
    const savedTheme = localStorage.getItem("theme-mode");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  } catch (error) {
    logger.warn("Failed to detect client theme:", error);
    return "light";
  }
}

/**
 * Get a cookie value by name (client-side)
 */
export async function getCookie(name: string): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const cookieStore = (
    globalThis as unknown as { cookieStore?: { get: (n: string) => Promise<{ value?: string } | null> } }
  ).cookieStore;
  if (cookieStore !== undefined) {
    try {
      const cookie = await cookieStore.get(name);
      return cookie?.value ?? null;
    } catch {
      // Fall through to legacy method
    }
  }

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const trimmedCookie = cookie.trimStart();
    if (trimmedCookie.startsWith(nameEQ)) {
      return trimmedCookie.substring(nameEQ.length);
    }
  }
  return null;
}

/**
 * Set theme preference in both localStorage and cookie
 */
export function setThemePreference(mode: PaletteMode) {
  if (typeof window === "undefined") return;

  try {
    // Set in localStorage for client-side persistence
    localStorage.setItem("theme-mode", mode);

    // Set cookie for server-side detection
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `theme-mode=${mode}; path=/; max-age=${maxAge.toString()}; SameSite=Lax`;

    // Force a page reload to ensure all components and styles are re-rendered cleanly
    // and that server-side components respect the new theme cookie.
    window.location.reload();
  } catch (error) {
    logger.warn("Failed to set theme preference:", error);
  }
}

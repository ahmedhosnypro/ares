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
  } catch (error) {
    logger.warn("Failed to set theme preference:", error);
  }
}

import { cookies, headers } from "next/headers";
import type { PaletteMode } from "@mui/material/styles";
import { logger } from "@/utils/logger";

/**
 * Server-side theme detection utility
 * Attempts to determine user's theme preference from cookies or headers
 * This file should only be imported by Server Components
 */
export async function getServerTheme(): Promise<PaletteMode> {
  try {
    // First, try to get theme from cookies
    const cookieStore = await cookies();
    const themeCookie = cookieStore.get("theme-mode");

    if (themeCookie?.value === "dark" || themeCookie?.value === "light") {
      return themeCookie.value as PaletteMode;
    }

    // Fallback: try to detect from user-agent or accept headers
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";

    // Check for dark mode indicators in user agent (some browsers/OS)
    if (userAgent.includes("Dark")) {
      return "dark";
    }

    // Default to light mode for SSR consistency
    return "light";
  } catch (error) {
    // If anything fails, default to light mode
    logger.warn("Failed to detect server theme:", error);
    return "light";
  }
}

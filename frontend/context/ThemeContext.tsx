"use client";
import { createContext } from "react";
import type { PaletteMode } from "@mui/material/styles";

export interface ThemeContextType {
  readonly mode: PaletteMode;
  readonly toggleTheme: () => void;
  readonly isThemeChanging: boolean;
  readonly setIsThemeChanging: (loading: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

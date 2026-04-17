"use client";
import { createContext } from "react";
import type { PaletteMode } from "@mui/material/styles";

export interface ThemeContextType {
  readonly mode: PaletteMode;
  readonly toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

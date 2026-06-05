"use client";

import { useState, useEffect, ReactNode, startTransition } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { createAppTheme } from "./theme";
import { getClientTheme, setThemePreference } from "@/lib/theme-detection";
import type { PaletteMode } from "@mui/material/styles";
import { ThemeContext } from "@/context/ThemeContext";

interface AppThemeProviderProps {
  readonly children: ReactNode;
  readonly initialTheme?: PaletteMode; // Allow server to pass initial theme
}

export function AppThemeProvider({ children, initialTheme = "light" }: AppThemeProviderProps) {
  const [mode, setMode] = useState<PaletteMode>(initialTheme);

  // Load theme preference from client on mount
  useEffect(() => {
    const clientTheme = getClientTheme();
    if (clientTheme !== mode) {
      startTransition(() => {
        setMode(clientTheme);
      });
    }
  }, [mode]);

  // Sync data-theme attribute for CSS variable application (e.g. from globals.css)
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setThemePreference(newMode);
    setMode(newMode);
  };

  const theme = createAppTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

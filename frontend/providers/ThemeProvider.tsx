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

  const toggleTheme = () => {
    setMode(prev => {
      const newMode = prev === "light" ? "dark" : "light";
      setThemePreference(newMode);
      return newMode;
    });
  };

  const theme = createAppTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <style jsx global>{`
          html {
            color-scheme: ${mode};
          }
        `}</style>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

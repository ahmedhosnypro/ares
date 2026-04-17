"use client";

import type { ReactNode } from "react";
import { AppThemeProvider } from "@/providers/ThemeProvider";
import EmotionCacheProvider from "@/lib/emotion-cache";
import type { PaletteMode } from "@mui/material/styles";

interface MuiProviderProps {
  readonly children: ReactNode;
  readonly initialTheme?: PaletteMode;
}

export default function MuiProvider({ children, initialTheme }: MuiProviderProps) {
  return (
    <EmotionCacheProvider>
      <AppThemeProvider initialTheme={initialTheme}>{children}</AppThemeProvider>
    </EmotionCacheProvider>
  );
}

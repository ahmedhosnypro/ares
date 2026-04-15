"use client";

import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { appTheme } from "@/src/theme";
import EmotionCacheProvider from "@/lib/emotion-cache";

interface MuiProviderProps {
  readonly children: ReactNode;
}

export default function MuiProvider({ children }: MuiProviderProps) {
  return (
    <EmotionCacheProvider>
      <ThemeProvider theme={appTheme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </EmotionCacheProvider>
  );
}

"use client";

import { type ReactNode, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useLocale } from "next-intl";
import { createAppTheme } from "./theme";
import { getClientTheme, getCookie, setThemePreference } from "@/lib/theme-detection";
import type { PaletteMode } from "@mui/material/styles";
import { ThemeContext } from "@/context/ThemeContext";

interface AppThemeProviderProps {
  readonly children: ReactNode;
  readonly initialTheme?: PaletteMode;
}

export function AppThemeProvider({ children, initialTheme = "light" }: AppThemeProviderProps) {
  const [mode, setMode] = useState<PaletteMode>(initialTheme);
  const [isThemeChanging, setIsThemeChanging] = useState<boolean>(false);
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    getCookie("theme-mode")
      .then(cookieTheme => {
        if (!isMounted.current) return;
        const clientTheme = cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : getClientTheme();

        if (clientTheme !== mode) {
          startTransition(() => {
            setMode(clientTheme);
          });
        }
      })
      .catch(() => {
        if (!isMounted.current) return;
        const clientTheme = getClientTheme();
        if (clientTheme !== mode) {
          startTransition(() => {
            setMode(clientTheme);
          });
        }
      });
  }, [mode]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = mode;
      document.documentElement.style.colorScheme = mode;
      document.documentElement.dir = direction;
      document.documentElement.lang = locale;
    }
  }, [mode, direction, locale]);

  const toggleTheme = useCallback(() => {
    setIsThemeChanging(true);
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    setThemePreference(newMode);

    setTimeout(() => {
      setIsThemeChanging(false);
    }, 300);
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode, direction, locale), [mode, direction, locale]);
  const themeContextValue = useMemo(
    () => ({ mode, toggleTheme, isThemeChanging, setIsThemeChanging }),
    [mode, toggleTheme, isThemeChanging]
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

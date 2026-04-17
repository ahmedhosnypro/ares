"use client";

import { IconButton, Tooltip } from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";
import { useThemeMode } from "@/context/useThemeMode";

interface ThemeSwitcherProps {
  readonly size?: "small" | "medium" | "large";
  readonly color?: "inherit" | "primary" | "secondary" | "default";
}

export default function ThemeSwitcher({ size = "medium", color = "inherit" }: ThemeSwitcherProps) {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
      <IconButton
        onClick={toggleTheme}
        color={color}
        size={size}
        sx={{
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "scale(1.1)",
          },
        }}
      >
        {mode === "light" ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
}

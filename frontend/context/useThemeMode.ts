"use client";
import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a AppThemeProvider");
  }
  return context;
};

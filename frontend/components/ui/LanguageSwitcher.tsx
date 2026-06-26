"use client";

import { TranslateOutlined } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Stack, Typography, Tooltip } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLanguageSwitch } from "@/hooks/useLanguageSwitch";
import type { Locale } from "@/shared/i18n/routing";

interface LanguageSwitcherProps {
  readonly size?: "small" | "medium" | "large";
  readonly color?: "inherit" | "primary" | "secondary" | "default";
}

export default function LanguageSwitcher({ size = "medium", color = "inherit" }: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const { currentLocale, switchLanguage, isPending } = useLanguageSwitch();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const languages: Array<{ code: Locale; label: string; shortLabel: string }> = [
    { code: "ar", label: t("langAr"), shortLabel: t("langArShort") },
    { code: "en", label: t("langEn"), shortLabel: t("langEnShort") },
  ];

  return (
    <>
      <Tooltip title={t("languageSwitcher")}>
        <span>
          <IconButton
            onClick={e => {
              setAnchorEl(e.currentTarget);
            }}
            disabled={isPending}
            color={color}
            size={size}
            sx={{
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "scale(1.1)",
              },
            }}
          >
            <TranslateOutlined />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
      >
        {languages.map(option => (
          <MenuItem
            key={option.code}
            selected={currentLocale === option.code}
            onClick={() => {
              switchLanguage(option.code);
              setAnchorEl(null);
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 32 }}>
                {option.shortLabel}
              </Typography>
              <Typography>{option.label}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Dashboard as DashboardIcon, History as HistoryIcon, Person as PersonIcon } from "@mui/icons-material";
import DashboardShell, { type DashboardMenuItem } from "../_components/DashboardShell";

export default function InspectorLayout({ children }: { readonly children: React.ReactNode }) {
  const t = useTranslations("dashboard.inspectorSidebar");
  const menuItems: DashboardMenuItem[] = [
    { text: t("dashboard"), icon: <DashboardIcon />, path: "/inspector" },
    { text: t("inspectionHistory"), icon: <HistoryIcon />, path: "/inspector/history" },
    { text: t("profile"), icon: <PersonIcon />, path: "/inspector/profile" },
  ];

  return (
    <DashboardShell
      menuItems={menuItems}
      sidebarLabel={t("sidebarLabel")}
      userFallbackName={t("userFallbackName")}
      userFallbackInitial={t("userFallbackInitial")}
      userRoleFallback={t("userRoleFallback")}
      notificationsHref="/inspector"
    >
      {children}
    </DashboardShell>
  );
}

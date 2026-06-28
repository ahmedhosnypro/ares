"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  EventAvailable as BookingIcon,
  People as UsersIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Public as CountriesIcon,
  Place as LocationsIcon,
  VerifiedUser as VerifiedUserIcon,
} from "@mui/icons-material";
import DashboardShell, { type DashboardMenuItem } from "../_components/DashboardShell";

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const t = useTranslations("dashboard.adminSidebar");
  const menuItems: DashboardMenuItem[] = [
    { text: t("dashboard"), icon: <DashboardIcon />, path: "/admin" },
    { text: t("bookings"), icon: <BookingIcon />, path: "/admin/bookings" },
    { text: t("vehicles"), icon: <CarIcon />, path: "/admin/vehicles" },
    { text: t("categories"), icon: <CategoryIcon />, path: "/admin/categories" },
    { text: t("users"), icon: <UsersIcon />, path: "/admin/users" },
    { text: t("verifications"), icon: <VerifiedUserIcon />, path: "/admin/verifications" },
    { text: t("locations"), icon: <LocationsIcon />, path: "/admin/locations" },
    { text: t("countries"), icon: <CountriesIcon />, path: "/admin/countries" },
    { text: t("notifications"), icon: <NotificationsIcon />, path: "/admin/notifications" },
    { text: t("settings"), icon: <SettingsIcon />, path: "/admin/settings" },
  ];

  return (
    <DashboardShell
      menuItems={menuItems}
      sidebarLabel={t("sidebarLabel")}
      userFallbackName={t("userFallbackName")}
      userFallbackInitial={t("userFallbackInitial")}
      userRoleFallback={t("userRoleFallback")}
      notificationsHref="/admin/notifications"
    >
      {children}
    </DashboardShell>
  );
}

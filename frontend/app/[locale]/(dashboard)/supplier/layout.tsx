"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  EventNote as BookingsIcon,
  AttachMoney as EarningsIcon,
  RateReview as ReviewsIcon,
} from "@mui/icons-material";
import DashboardShell, { type DashboardMenuItem } from "../_components/DashboardShell";

import { useSession } from "next-auth/react";
import { Alert, Box, AlertTitle } from "@mui/material";

export default function SupplierLayout({ children }: { readonly children: React.ReactNode }) {
  const { data: session } = useSession();
  const isRestricted = session?.user.status?.toLowerCase() === "restricted";
  const t = useTranslations("dashboard.supplierSidebar");
  const menuItems: DashboardMenuItem[] = [
    { text: t("dashboard"), icon: <DashboardIcon />, path: "/supplier/dashboard" },
    { text: t("vehicles"), icon: <CarIcon />, path: "/supplier/vehicles" },
    { text: t("bookings"), icon: <BookingsIcon />, path: "/supplier/bookings" },
    { text: t("reviews"), icon: <ReviewsIcon />, path: "/supplier/reviews" },
    { text: t("earnings"), icon: <EarningsIcon />, path: "/supplier/earnings" },
  ];

  return (
    <DashboardShell
      menuItems={menuItems}
      sidebarLabel={t("sidebarLabel")}
      userFallbackName={t("userFallbackName")}
      userFallbackInitial={t("userFallbackInitial")}
      userRoleFallback={t("userRoleFallback")}
      notificationsHref="/supplier/notifications"
    >
      {isRestricted && (
        <Box sx={{ p: 3, pb: 0 }}>
          <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>{t("accountRestricted")}</AlertTitle>
            {t("accountRestrictedMessage")}
          </Alert>
        </Box>
      )}
      {children}
    </DashboardShell>
  );
}

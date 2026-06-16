"use client";

import React from "react";
import {
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  EventNote as BookingsIcon,
  AttachMoney as EarningsIcon,
  RateReview as ReviewsIcon,
} from "@mui/icons-material";
import DashboardShell, { type DashboardMenuItem } from "../_components/DashboardShell";

const menuItems: DashboardMenuItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/supplier/dashboard" },
  { text: "Vehicles", icon: <CarIcon />, path: "/supplier/vehicles" },
  { text: "Bookings", icon: <BookingsIcon />, path: "/supplier/bookings" },
  { text: "Reviews", icon: <ReviewsIcon />, path: "/supplier/reviews" },
  { text: "Earnings", icon: <EarningsIcon />, path: "/supplier/earnings" },
];

import { useSession } from "next-auth/react";
import { Alert, Box, AlertTitle } from "@mui/material";

export default function SupplierLayout({ children }: { readonly children: React.ReactNode }) {
  const { data: session } = useSession();
  const isRestricted = session?.user?.status?.toLowerCase() === "restricted";

  return (
    <DashboardShell
      menuItems={menuItems}
      sidebarLabel="Supplier"
      userFallbackName="Supplier"
      userFallbackInitial="S"
      userRoleFallback="Supplier"
      notificationsHref="/supplier/notifications"
    >
      {isRestricted && (
        <Box sx={{ p: 3, pb: 0 }}>
          <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Account Restricted</AlertTitle>
            Your account has been restricted by administration. You may continue viewing your bookings, vehicles, reports and earnings, but you cannot perform any actions until the restriction is removed.
          </Alert>
        </Box>
      )}
      {children}
    </DashboardShell>
  );
}

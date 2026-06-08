"use client";

import React from "react";
import {
  Dashboard as DashboardIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  History as HistoryIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import DashboardShell, { type DashboardMenuItem } from "../_components/DashboardShell";

const menuItems: DashboardMenuItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/inspector" },
  { text: "Assigned Inspections", icon: <AssignmentTurnedInIcon />, path: "/inspector/inspections" },
  { text: "Inspection History", icon: <HistoryIcon />, path: "/inspector/history" },
  { text: "Profile", icon: <PersonIcon />, path: "/inspector/profile" },
];

export default function InspectorLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <DashboardShell
      menuItems={menuItems}
      sidebarLabel="Inspector"
      userFallbackName="Inspector"
      userFallbackInitial="I"
      userRoleFallback="Inspector"
      notificationsHref="/inspector"
    >
      {children}
    </DashboardShell>
  );
}

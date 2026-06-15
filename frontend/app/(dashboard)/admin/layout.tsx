"use client";

import React from "react";
import {
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  EventAvailable as BookingIcon,
  People as UsersIcon,
  Storefront as SupplierIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Public as CountriesIcon,
  Place as LocationsIcon,
  VerifiedUser as VerifiedUserIcon,
  ManageSearch as InspectorsIcon,
  AirlineSeatReclineNormal as DriversIcon,
} from "@mui/icons-material";
import DashboardShell, { type DashboardMenuItem } from "../_components/DashboardShell";

const menuItems: DashboardMenuItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
  { text: "Bookings", icon: <BookingIcon />, path: "/admin/bookings" },
  { text: "Vehicles", icon: <CarIcon />, path: "/admin/vehicles" },
  { text: "Categories", icon: <CategoryIcon />, path: "/admin/categories" },
  { text: "Suppliers", icon: <SupplierIcon />, path: "/admin/suppliers" },
  { text: "Users", icon: <UsersIcon />, path: "/admin/users" },
  { text: "Inspectors", icon: <InspectorsIcon />, path: "/admin/inspectors" },
  { text: "Drivers", icon: <DriversIcon />, path: "/admin/drivers" },
  { text: "Verifications", icon: <VerifiedUserIcon />, path: "/admin/verifications" },
  { text: "Locations", icon: <LocationsIcon />, path: "/admin/locations" },
  { text: "Countries", icon: <CountriesIcon />, path: "/admin/countries" },
  { text: "Notifications", icon: <NotificationsIcon />, path: "/admin/notifications" },
  { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
];

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <DashboardShell
      menuItems={menuItems}
      sidebarLabel="Admin"
      userFallbackName="Admin User"
      userFallbackInitial="A"
      userRoleFallback="Administrator"
      notificationsHref="/admin/notifications"
    >
      {children}
    </DashboardShell>
  );
}

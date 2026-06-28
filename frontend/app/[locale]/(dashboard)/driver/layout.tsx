"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/shared/i18n/routing";
import {
  Dashboard as DashboardIcon,
  Route as TripsIcon,
  AttachMoney as EarningsIcon,
  Person as ProfileIcon,
} from "@mui/icons-material";
import DashboardShell, { type DashboardMenuItem } from "../_components/DashboardShell";
import { CircularProgress, Box } from "@mui/material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export default function DriverLayout({ children }: { readonly children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const t = useTranslations("dashboard.driverSidebar");
  const menuItems: DashboardMenuItem[] = [
    { text: t("dashboard"), icon: <DashboardIcon />, path: "/driver/dashboard" },
    { text: t("myTrips"), icon: <TripsIcon />, path: "/driver/trips" },
    { text: t("earnings"), icon: <EarningsIcon />, path: "/driver/earnings" },
    { text: t("profile"), icon: <ProfileIcon />, path: "/driver/profile" },
  ];

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    if (!session?.user.roles.includes("Driver")) {
      router.push("/");
      return;
    }

    // Check driver profile status
    const checkProfileStatus = async () => {
      try {
        const response = await fetch(toApiUrl("/api/driver/profile/me"), {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!response.ok) {
          // If profile doesn't exist or error, assume incomplete
          if (pathname !== "/driver/complete-profile") {
            router.push("/driver/complete-profile");
          }
          setIsChecking(false);
          return;
        }

        const data = (await response.json()) as { status: string };
        const profileStatus = data.status;

        if (profileStatus === "Incomplete" && pathname !== "/driver/complete-profile") {
          router.push("/driver/complete-profile");
        } else if (
          (profileStatus === "PendingVerification" || profileStatus === "Rejected" || profileStatus === "Suspended") &&
          pathname !== "/driver/verification-status"
        ) {
          router.push("/driver/verification-status");
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        logger.error("Failed to check driver profile status:", error);
        setIsChecking(false);
      }
    };

    void checkProfileStatus();
  }, [session, status, router, pathname]);

  if (status === "loading" || isChecking) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const isRestricted = pathname === "/driver/complete-profile" || pathname === "/driver/verification-status";

  return (
    <DashboardShell
      menuItems={isRestricted ? [] : menuItems}
      sidebarLabel={t("sidebarLabel")}
      userFallbackName={session?.user?.firstName ?? t("userFallbackName")}
      userFallbackInitial={session?.user?.firstName?.[0] ?? t("userFallbackInitial")}
      userRoleFallback={t("userRoleFallback")}
      notificationsHref="/driver/notifications"
    >
      {children}
    </DashboardShell>
  );
}

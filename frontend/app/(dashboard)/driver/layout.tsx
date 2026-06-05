"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dashboard as DashboardIcon,
  DirectionsCar as RequestsIcon,
  Route as TripsIcon,
  AttachMoney as EarningsIcon,
  Person as ProfileIcon,
} from "@mui/icons-material";
import DashboardShell, { type DashboardMenuItem } from "../_components/DashboardShell";
import { CircularProgress, Box } from "@mui/material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

const menuItems: DashboardMenuItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/driver/dashboard" },
  { text: "Requests", icon: <RequestsIcon />, path: "/driver/requests" },
  { text: "My Trips", icon: <TripsIcon />, path: "/driver/trips" },
  { text: "Earnings", icon: <EarningsIcon />, path: "/driver/earnings" },
  { text: "Profile", icon: <ProfileIcon />, path: "/driver/profile" },
];

export default function DriverLayout({ children }: { readonly children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    if (!session?.user?.roles?.includes("Driver")) {
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

        const data = await response.json();
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
      sidebarLabel="Driver"
      userFallbackName={session?.user?.firstName ?? "Driver"}
      userFallbackInitial={session?.user?.firstName?.[0] ?? "D"}
      userRoleFallback="Driver"
      notificationsHref="/driver/notifications"
    >
      {children}
    </DashboardShell>
  );
}

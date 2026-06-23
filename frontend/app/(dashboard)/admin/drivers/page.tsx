"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";

/**
 * /admin/drivers is now consolidated into /admin/users?tab=drivers.
 * This stub silently redirects any direct/bookmarked links.
 */
export default function DriversRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/users?tab=drivers");
  }, [router]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <CircularProgress />
    </Box>
  );
}

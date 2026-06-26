"use client";

import { useEffect } from "react";
import { useRouter } from "@/shared/i18n/routing";
import { Box, CircularProgress } from "@mui/material";

/**
 * /admin/inspectors is now consolidated into /admin/users?tab=inspectors.
 * This stub silently redirects any direct/bookmarked links.
 */
export default function InspectorsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/users?tab=inspectors");
  }, [router]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <CircularProgress />
    </Box>
  );
}

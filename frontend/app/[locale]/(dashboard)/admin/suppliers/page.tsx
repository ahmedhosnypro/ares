"use client";

import { useEffect } from "react";
import { useRouter } from "@/shared/i18n/routing";
import { Box, CircularProgress } from "@mui/material";

/**
 * /admin/suppliers is now consolidated into /admin/users?tab=suppliers.
 * This stub silently redirects any direct/bookmarked links.
 */
export default function SuppliersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/users?tab=suppliers");
  }, [router]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <CircularProgress />
    </Box>
  );
}

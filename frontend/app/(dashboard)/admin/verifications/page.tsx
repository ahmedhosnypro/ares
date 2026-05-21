"use client";

/**
 * Admin Verification Management page.
 *
 * The page hosts two review workflows under a single header:
 *   1. Identity Verification — pre-existing flow (unchanged behaviour).
 *   2. Driver License Verification — added in this iteration.
 *
 * The two tabs swap their content inside the same page; the admin layout,
 * navigation, and dashboard chrome are intentionally left untouched. Each
 * tab owns its own state, API calls, modals and toasts so the implementation
 * is purely additive — nothing about the existing identity flow is altered.
 */

import { useState, type SyntheticEvent } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import IdentityVerificationTab from "./_components/IdentityVerificationTab";
import DriverLicenseTab from "./_components/DriverLicenseTab";

type VerificationTabKey = "identity" | "driver-license";

export default function AdminVerificationsPage() {
  const [tab, setTab] = useState<VerificationTabKey>("identity");

  const handleTabChange = (_: SyntheticEvent, value: VerificationTabKey) => {
    setTab(value);
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* HEADER — unchanged copy from the original identity-only page. */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}>
            Verification Management
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Review and manage user identity and driver license verifications
          </Typography>
        </Box>
      </Stack>

      {/* TABS — content swaps inside the same page; no routing change. */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          aria-label="Verification management tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Identity Verification" value="identity" />
          <Tab label="Driver License" value="driver-license" />
        </Tabs>
      </Box>

      {/*
        Render only the active tab so each tab's effects (fetch on mount,
        modals, snackbar) are scoped cleanly. Mounting both at once would
        double the network requests and make state harder to reason about.
      */}
      {tab === "identity" && <IdentityVerificationTab />}
      {tab === "driver-license" && <DriverLicenseTab />}
    </Box>
  );
}

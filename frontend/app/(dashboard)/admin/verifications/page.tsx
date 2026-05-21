"use client";

import { Box, Stack, Typography } from "@mui/material";
import IdentityVerificationTab from "./_components/IdentityVerificationTab";

export default function AdminVerificationsPage() {
  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}>
            Verification Management
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Review and manage user identity verifications
          </Typography>
        </Box>
      </Stack>

      <IdentityVerificationTab />
    </Box>
  );
}

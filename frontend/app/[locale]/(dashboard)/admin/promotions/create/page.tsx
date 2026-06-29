"use client";

import { useState, useCallback } from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { createDiscountCode, type DiscountCodeCreateRequest } from "@/api-clients/promotions/promotions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import DiscountCodeForm from "../_components/DiscountCodeForm";

export default function CreatePromotionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.promotions");

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSubmit = useCallback(
    async (data: DiscountCodeCreateRequest) => {
      try {
        setLoading(true);
        const token = session?.accessToken ?? "";
        await createDiscountCode(data, token);
        setSnackbar({ open: true, message: "Discount created successfully", severity: "success" });
        router.push("/admin/promotions");
      } catch (err: unknown) {
        logger.error("Failed to create discount code", err);
        setSnackbar({
          open: true,
          message: err instanceof ApiError ? err.message : "Failed to create discount code",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [session, router]
  );

  const handleCancel = useCallback(() => {
    router.push("/admin/promotions");
  }, [router]);

  return (
    <Box sx={{ width: "100%", maxWidth: 780, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" sx={{ alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {t("createTitle")}
        </Typography>
        {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      </Stack>

      <DiscountCodeForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => {
          setSnackbar({ ...snackbar, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

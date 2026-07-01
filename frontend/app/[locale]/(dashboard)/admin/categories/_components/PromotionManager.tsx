"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Paper, Stack, Button, CircularProgress, Chip, useTheme, alpha } from "@mui/material";
import { AddRounded as AddIcon, LocalOffer as PromoIcon } from "@mui/icons-material";
import { getDiscountCodes, type DiscountCodeResponse } from "@/api-clients/promotions/promotions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDate } from "@/utils/dateTime";
import { getSession } from "next-auth/react";

export default function PromotionManager({ categoryId }: { readonly categoryId: string }) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.categoryDetails");
  const locale = useLocale();
  const [discounts, setDiscounts] = useState<DiscountCodeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getSession();
      const token = session?.accessToken ?? "";
      const res = await getDiscountCodes({ page: 1, pageSize: 100 }, token);
      const matching = res.data.filter(d => d.vehicleCategoryIds.includes(categoryId));
      setDiscounts(matching);
    } catch {
      setError(t("promotions.alerts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [categoryId, t]);

  useEffect(() => {
    void fetchDiscounts();
  }, [fetchDiscounts]);

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CircularProgress size={30} />
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
            <PromoIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("promotions.activeScheduled")}
            </Typography>
          </Stack>
          <Button size="small" startIcon={<AddIcon />} href="/admin/promotions/create" sx={{ fontWeight: 700 }}>
            {t("promotions.addBtn")}
          </Button>
        </Box>
        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : discounts.length > 0 ? (
            <Stack spacing={2}>
              {discounts.map(discount => (
                <Paper
                  key={discount.discountId}
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: "primary.main" }}>{discount.code}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
                        {discount.discountValue}
                        {discount.discountType === "percentage" ? t("promotions.percentOff") : " off"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {discount.validFrom ? formatUtcDate(discount.validFrom, locale) : ""} -{" "}
                        {discount.validTo ? formatUtcDate(discount.validTo, locale) : ""}
                      </Typography>
                    </Box>
                    <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
                      <Chip
                        label={discount.isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: alpha(
                            discount.isActive ? theme.palette.success.main : theme.palette.text.disabled,
                            0.15
                          ),
                          color: discount.isActive ? "success.main" : "text.secondary",
                        }}
                      />
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t("promotions.empty")}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbar({ ...snackbar, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}

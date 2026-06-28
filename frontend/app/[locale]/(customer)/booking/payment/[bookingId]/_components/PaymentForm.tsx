"use client";

import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useTranslations } from "next-intl";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface PaymentFormProps {
  readonly bookingId: string;
  readonly accessToken: string;
}

interface InitiateResponse {
  readonly iframeUrl: string;
  readonly internalTransactionId: string;
  readonly paymobOrderId: string;
}

export default function PaymentForm({ bookingId, accessToken }: PaymentFormProps) {
  const t = useTranslations("customer.bookingPayment");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const initiate = async () => {
      try {
        const res = await fetch(toApiUrl("/api/payments/initiate"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ bookingId }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? t("form.initiationFailed"));
        }
        const data = (await res.json()) as InitiateResponse;
        setIframeUrl(data.iframeUrl);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        logger.error("Payment initiation failed", err);
        setError(err instanceof Error ? err.message : t("form.loadFailed"));
      }
    };
    void initiate();
    return () => {
      controller.abort();
    };
  }, [bookingId, accessToken, t]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: t => t.palette.shadow.card,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <LockIcon sx={{ color: "success.main", fontSize: 20 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
            {t("form.securePayment")}
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {!error && !iframeUrl && (
          <Stack sx={{ alignItems: "center", py: 6 }} spacing={2}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              {t("form.loading")}
            </Typography>
          </Stack>
        )}

        {iframeUrl && (
          <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
            <iframe
              src={iframeUrl}
              width="100%"
              height="600"
              title={t("form.iframeTitle")}
              style={{ display: "block", border: 0 }}
            />
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

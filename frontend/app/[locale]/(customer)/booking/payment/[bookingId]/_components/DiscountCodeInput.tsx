"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Stack, TextField, Button, CircularProgress, Box, Typography, IconButton, alpha } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { validateDiscountCode, type DiscountValidationResponse } from "@/api-clients/offers/offers";
import { formatCurrency } from "@/utils/currency-helpers";
import { logger } from "@/utils/logger";

interface DiscountCodeInputProps {
  readonly vehicleId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly subtotal: number;
  readonly accessToken: string;
  readonly onDiscountApplied: (result: DiscountValidationResponse) => void;
  readonly onDiscountRemoved: () => void;
}

export default function DiscountCodeInput({
  vehicleId,
  startDate,
  endDate,
  subtotal,
  accessToken,
  onDiscountApplied,
  onDiscountRemoved,
}: DiscountCodeInputProps) {
  const t = useTranslations("customer.bookingPayment");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const result = await validateDiscountCode(
        {
          code: trimmed,
          vehicleId,
          startDate,
          endDate,
          subtotal,
        },
        accessToken
      );

      if (result.isValid) {
        setAppliedDiscount(result);
        onDiscountApplied(result);
      } else {
        const firstError = result.errors.length > 0 ? result.errors[0].message : t("discountCodeInvalid");
        setError(firstError);
      }
    } catch (err) {
      logger.error("Failed to validate discount code", err);
      setError(t("discountCodeInvalid"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedDiscount(null);
    setCode("");
    setError(null);
    onDiscountRemoved();
  };

  if (appliedDiscount) {
    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          bgcolor: theme => alpha(theme.palette.success.main, 0.1),
          borderRadius: 1,
          p: 1.5,
        }}
      >
        <CheckCircleOutlinedIcon sx={{ color: "success.main", fontSize: 20 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main", display: "block" }}>
            {t("discountCodeApplied")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("discountSavings", { amount: formatCurrency(appliedDiscount.discountAmount) })}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleRemove} sx={{ color: "success.main" }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <TextField
          size="small"
          label={t("discountCodeLabel")}
          placeholder={t("discountCodePlaceholder")}
          value={code}
          onChange={e => {
            setCode(e.target.value);
          }}
          slotProps={{ htmlInput: { autoComplete: "off" } }}
          disabled={loading}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          size="small"
          disabled={!code.trim() || loading}
          onClick={() => {
            void handleApply();
          }}
          sx={{ minWidth: 80, height: 40 }}
        >
          {loading ? <CircularProgress size={20} /> : t("discountCodeApply")}
        </Button>
      </Stack>
      {error && (
        <Typography variant="caption" sx={{ color: "error.main", display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

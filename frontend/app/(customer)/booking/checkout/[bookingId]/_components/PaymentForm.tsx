"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as cardValidator from "card-validator";
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { paymentSchema, type PaymentFormData } from "@/lib/validation/schemas";

interface PaymentFormProps {
  readonly bookingId: string;
  readonly amount: number;
  readonly accessToken: string;
}

interface PaymentResponse {
  readonly transactionId: string;
  readonly status: string;
  readonly message: string;
}

// ── Formatters & Helpers ───────────────────────────────────────────────────────

const getCardIconUrl = (type: string | null) => {
  if (!type) return null;
  const map: Record<string, string> = {
    visa: "visa",
    mastercard: "mastercard",
    "american-express": "amex",
    discover: "discover",
    "diners-club": "diners",
    jcb: "jcb",
    unionpay: "unionpay",
    maestro: "maestro",
  };
  const key = map[type] || type;
  return `/img/cards/${key}.svg`;
};

const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/\D/gi, "");
  const parts = [];

  for (let i = 0, len = v.length; i < len; i += 4) {
    parts.push(v.substring(i, i + 4));
  }

  return parts.join(" ").substring(0, 19); // Max 16 digits + 3 spaces
};

const formatExpiryDate = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/\D/gi, "");
  if (v.length >= 2) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}`.substring(0, 5);
  }
  return v;
};

const formatCVV = (value: string) => {
  return value.replace(/\D/gi, "").substring(0, 4);
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function PaymentForm({ bookingId, amount, accessToken }: PaymentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [cardType, setCardType] = useState<string | null>(null);

  // Refs for auto-focus
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    mode: "onChange",
    defaultValues: {
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: "",
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      logger.info("Processing payment", {
        bookingId,
        cardHolder: data.cardHolder,
        cardLast4: data.cardNumber.slice(-4),
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch(toApiUrl("/api/payments/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          bookingId,
          amount,
          paymentMethodId: "00000000-0000-0000-0000-000000000000",
          paymentMethod: "credit_card",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Payment processing failed. Please try again.");
      }

      const payload = (await response.json()) as PaymentResponse;

      if (payload.status === "Captured" || payload.status === "Success") {
        router.push(`/bookings/confirmation/${bookingId}`);
      } else {
        setServerError(payload.message || "Payment was not successful. Please verify your details.");
      }
    } catch (err) {
      logger.error("Payment submission error", err);
      setServerError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={3}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CreditCardIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Payment Method
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Secure payment via simulated Credit or Debit card.
        </Typography>

        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Box
          component="form"
          onSubmit={e => {
            void handleSubmit(onSubmit)(e);
          }}
          noValidate
        >
          <Grid container spacing={2.5}>
            {/* 1. Card Number */}
            <Grid size={12}>
              <Controller
                name="cardNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Card Number"
                    placeholder="•••• •••• •••• ••••"
                    disabled={isSubmitting}
                    error={
                      !!errors.cardNumber && (isSubmitted || !cardValidator.number(field.value).isPotentiallyValid)
                    }
                    helperText={
                      isSubmitted || !cardValidator.number(field.value).isPotentiallyValid
                        ? errors.cardNumber?.message
                        : ""
                    }
                    onChange={e => {
                      const formatted = formatCardNumber(e.target.value);
                      field.onChange(formatted);

                      const validation = cardValidator.number(formatted);
                      setCardType(validation.card?.type ?? null);

                      if (validation.isPotentiallyValid && validation.isValid) {
                        expiryRef.current?.focus();
                      }
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            {cardType ? (
                              <Box
                                component="img"
                                src={getCardIconUrl(cardType) || ""}
                                alt={cardType}
                                sx={{
                                  height: 20,
                                  width: "auto",
                                  display: "block",
                                  filter: errors.cardNumber ? "grayscale(1) opacity(0.5)" : "none",
                                }}
                                onError={e => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <CreditCardIcon fontSize="small" color={errors.cardNumber ? "error" : "action"} />
                            )}
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {cardValidator.number(field.value).isValid && (
                              <CheckCircleIcon fontSize="small" color="success" />
                            )}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* 2. Expiry Date */}
            <Grid size={6}>
              <Controller
                name="expiryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    inputRef={expiryRef}
                    label="Expiry Date"
                    placeholder="MM/YY"
                    disabled={isSubmitting}
                    error={
                      !!errors.expiryDate &&
                      (isSubmitted || !cardValidator.expirationDate(field.value).isPotentiallyValid)
                    }
                    helperText={
                      isSubmitted || !cardValidator.expirationDate(field.value).isPotentiallyValid
                        ? errors.expiryDate?.message
                        : ""
                    }
                    onChange={e => {
                      const formatted = formatExpiryDate(e.target.value);
                      field.onChange(formatted);
                      if (formatted.length === 5 && cardValidator.expirationDate(formatted).isValid) {
                        cvvRef.current?.focus();
                      }
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            {cardValidator.expirationDate(field.value).isValid ? (
                              <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                              <CalendarMonthIcon fontSize="small" color={errors.expiryDate ? "error" : "action"} />
                            )}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* 3. CVV */}
            <Grid size={6}>
              <Controller
                name="cvv"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    inputRef={cvvRef}
                    label="CVV"
                    type="password"
                    placeholder="***"
                    disabled={isSubmitting}
                    error={!!errors.cvv && (isSubmitted || !cardValidator.cvv(field.value).isPotentiallyValid)}
                    helperText={
                      isSubmitted || !cardValidator.cvv(field.value).isPotentiallyValid ? errors.cvv?.message : ""
                    }
                    onChange={e => {
                      const formatted = formatCVV(e.target.value);
                      field.onChange(formatted);
                      const validation = cardValidator.cvv(formatted);
                      if (validation.isPotentiallyValid && validation.isValid) {
                        nameRef.current?.focus();
                      }
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            {cardValidator.cvv(field.value).isValid ? (
                              <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                              <SecurityIcon fontSize="small" color={errors.cvv ? "error" : "action"} />
                            )}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* 4. Cardholder Name */}
            <Grid size={12}>
              <Controller
                name="cardHolder"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    inputRef={nameRef}
                    label="Cardholder Name"
                    placeholder="John Doe"
                    disabled={isSubmitting}
                    error={!!errors.cardHolder}
                    helperText={errors.cardHolder?.message}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            {field.value.length >= 2 && !errors.cardHolder ? (
                              <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                              <PersonIcon fontSize="small" color={errors.cardHolder ? "error" : "action"} />
                            )}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              sx={{
                height: 56,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: "1.1rem",
                textTransform: "none",
              }}
            >
              {isSubmitting ? (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="body1" sx={{ fontWeight: 800 }}>
                    Processing...
                  </Typography>
                </Stack>
              ) : (
                `Pay ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)}`
              )}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: "text.secondary" }}>
          <LockIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            SSL Secured & PCI Compliant (Simulated)
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

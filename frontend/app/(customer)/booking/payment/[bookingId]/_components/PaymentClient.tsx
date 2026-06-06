"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import TimerIcon from "@mui/icons-material/Timer";
import WarningIcon from "@mui/icons-material/Warning";
import { beginPayment, CheckoutError } from "@/api-clients/checkout/checkout";
import { logger } from "@/utils/logger";
import PaymentForm from "./PaymentForm";
import ExpressCheckout from "./ExpressCheckout";
import OrderSummary from "./OrderSummary";

export interface BookingDetailsDto {
  readonly id: string;
  readonly car: {
    readonly vehicleId: string;
    readonly make: string;
    readonly model: string;
    readonly image: string;
    readonly supplier: {
      readonly id: string;
      readonly name: string;
    };
  };
  readonly pickupLocation: { readonly label: string };
  readonly dropOffLocation: { readonly label: string };
  readonly from: string;
  readonly to: string;
  readonly price: number;
  readonly status: string;
  readonly assignedDriverProfile?: { readonly driverProfileId: string } | null;
}

interface PaymentClientProps {
  readonly booking: BookingDetailsDto;
  readonly accessToken: string;
}

export default function PaymentClient({ booking, accessToken }: PaymentClientProps) {
  const router = useRouter();
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize the vehicle hold on page mount
  useEffect(() => {
    let active = true;
    const initHold = async () => {
      try {
        setLoading(true);
        const state = await beginPayment(booking.id, accessToken);
        if (!active) return;

        if (state.holdSecondsRemaining !== undefined && state.holdSecondsRemaining !== null) {
          setHoldSecondsLeft(state.holdSecondsRemaining);
          if (state.holdSecondsRemaining <= 0) {
            setHoldExpired(true);
          }
        }
      } catch (err) {
        if (!active) return;
        logger.error("Failed to begin payment hold", err);
        if (err instanceof CheckoutError) {
          setErrorStatus(err.status);
          setErrorMessage(err.message);
        } else {
          setErrorStatus(500);
          setErrorMessage("An unexpected error occurred while placing the reservation hold.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void initHold();
    return () => {
      active = false;
    };
  }, [booking.id, accessToken]);

  // Handle countdown timer ticking
  useEffect(() => {
    if (holdSecondsLeft === null || holdExpired || errorStatus) return;

    const interval = setInterval(() => {
      setHoldSecondsLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          setHoldExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [holdSecondsLeft, holdExpired, errorStatus]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle specialized errors (Verification Required, Vehicle Unavailable, etc.)
  if (errorStatus) {
    const isVerificationRequired = errorStatus === 403;
    const isConflict = errorStatus === 409;

    return (
      <Box sx={{ minHeight: "80vh", display: "grid", placeItems: "center", px: 2 }}>
        <Card
          variant="outlined"
          sx={{
            maxWidth: 500,
            width: "100%",
            p: 2,
            borderColor: isVerificationRequired ? "warning.main" : "error.main",
            borderWidth: 1.5,
            boxShadow: t => t.palette.shadow.card,
          }}
        >
          <CardContent>
            <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
              <WarningIcon color={isVerificationRequired ? "warning" : "error"} sx={{ fontSize: 48 }} />
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    color: isVerificationRequired ? "warning.main" : "error.main",
                  }}
                >
                  {isVerificationRequired ? "Verification Required" : "Vehicle Unavailable"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {errorMessage ||
                    (isConflict
                      ? "This vehicle has just been reserved by another customer."
                      : "An unexpected error occurred.")}
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => {
                  router.push(isVerificationRequired ? "/account/profile" : "/");
                }}
                sx={{
                  fontWeight: 800,
                  borderRadius: 999,
                  px: 4,
                  height: 48,
                  textTransform: "none",
                  bgcolor: isVerificationRequired ? "warning.main" : "primary.main",
                  "&:hover": {
                    bgcolor: isVerificationRequired ? "warning.dark" : "primary.dark",
                  },
                }}
              >
                {isVerificationRequired ? "Complete Verification" : "Browse Other Vehicles"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const enableApplePay = process.env.ENABLE_APPLE_PAY === "true";
  const enableGooglePay = process.env.ENABLE_GOOGLE_PAY === "true";

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 10 } }}>
      <Container maxWidth="lg">
        {/* Header & Stepper */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.04em", color: "primary.main" }}>
              Complete Booking
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: "1.125rem" }}>
              Review your details and complete secure payment.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
              <Box sx={{ height: 8, flexGrow: 1, bgcolor: "primary.main", borderRadius: 999 }} />
              <Box sx={{ height: 8, flexGrow: 1, bgcolor: "primary.main", borderRadius: 999 }} />
              <Box sx={{ height: 8, flexGrow: 1, bgcolor: "secondary.main", borderRadius: 999, position: "relative" }}>
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    top: -24,
                    right: 0,
                    fontWeight: 700,
                    color: "secondary.main",
                  }}
                >
                  Payment
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Left Column: Payment & Timer Banner */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 2, lg: 1 } }}>
            <Stack spacing={4}>
              {/* Expiry Alerts & Timer Statuses */}
              {holdExpired ? (
                <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Your reservation hold has expired
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      The hold on this vehicle has lapsed. To guarantee your booking, please restart the checkout
                      process.
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        router.push(`/vehicles/${booking.car.vehicleId}`);
                      }}
                      sx={{
                        fontWeight: 800,
                        borderRadius: 999,
                        textTransform: "none",
                      }}
                    >
                      Restart Booking
                    </Button>
                  </Box>
                </Alert>
              ) : (
                holdSecondsLeft !== null && (
                  <Alert
                    severity="warning"
                    icon={<TimerIcon />}
                    sx={{
                      mb: 1,
                      alignItems: "center",
                      "& .MuiAlert-message": {
                        width: "100%",
                        display: "flex",
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        We are holding this vehicle for you
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        Please complete your payment within the next few minutes to secure your booking.
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: 80,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          fontFamily: "monospace",
                          color: "warning.main",
                          lineHeight: 1.2,
                        }}
                      >
                        {formatTime(holdSecondsLeft)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "text.secondary",
                        }}
                      >
                        Remaining
                      </Typography>
                    </Box>
                  </Alert>
                )
              )}

              <ExpressCheckout enableApplePay={enableApplePay} enableGooglePay={enableGooglePay} />
              {holdExpired ? null : <PaymentForm bookingId={booking.id} accessToken={accessToken} />}
            </Stack>
          </Grid>

          {/* Right Column: Order Summary */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 1, lg: 2 } }}>
            <OrderSummary booking={booking} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

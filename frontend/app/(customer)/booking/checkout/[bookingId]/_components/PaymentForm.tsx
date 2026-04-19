"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LockIcon from "@mui/icons-material/Lock";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

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

export default function PaymentForm({ bookingId, amount, accessToken }: PaymentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Simulate a small delay for payment processing
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
          paymentMethodId: "00000000-0000-0000-0000-000000000000", // Generic ID for new card
          paymentMethod: "credit_card",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Payment processing failed.");
      }

      const payload = (await response.json()) as PaymentResponse;
      
      if (payload.status === "Captured" || payload.status === "Success") {
        router.push(`/bookings/confirmation/${bookingId}`);
      } else {
        setError(payload.message || "Payment was not successful. Please try again.");
      }
    } catch (err) {
      logger.error("Payment submission error", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred during payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <CreditCardIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Payment Method
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Secure payment via simulated Credit or Debit card.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Box
          component="form"
          onSubmit={event => {
            void handleSubmit(event);
          }}
        >
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <TextField
                required
                fullWidth
                label="Card Number"
                name="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={formValues.cardNumber}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                required
                fullWidth
                label="Cardholder Name"
                name="cardHolder"
                placeholder="John Doe"
                value={formValues.cardHolder}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                required
                fullWidth
                label="Expiry Date"
                name="expiryDate"
                placeholder="MM/YY"
                value={formValues.expiryDate}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                required
                fullWidth
                label="CVV"
                name="cvv"
                type="password"
                placeholder="***"
                value={formValues.cvv}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>

          <Box mt={4}>
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
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="body1" fontWeight={800}>Processing...</Typography>
                </Stack>
              ) : (
                "Complete Payment"
              )}
            </Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="center" gap={1} color="text.secondary">
          <LockIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" fontWeight={600}>
            SSL Secured & PCI Compliant (Simulated)
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

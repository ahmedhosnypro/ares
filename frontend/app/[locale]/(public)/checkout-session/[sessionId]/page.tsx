import { redirect } from "@/shared/i18n/routing";
import { getLocale } from "next-intl/server";
import { Box, Container, Paper, Stack, Typography, Button } from "@mui/material";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";

interface PageProps {
  readonly searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CheckoutSessionPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const params = await searchParams;

  const success = params["success"] === "true";
  const merchantOrderId = params["merchant_order_id"] ?? params["order"] ?? null;

  // On success, redirect immediately to confirmation
  if (success && merchantOrderId) {
    redirect({ href: `/bookings/confirmation/${merchantOrderId}`, locale });
  }

  // On failure, show error UI
  return (
    <Box
      component="main"
      sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", py: 8 }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <Stack spacing={3} sx={{ alignItems: "center" }}>
            {success ? (
              <CheckCircleOutlinedIcon sx={{ fontSize: 72, color: "success.main" }} />
            ) : (
              <ErrorOutlinedIcon sx={{ fontSize: 72, color: "error.main" }} />
            )}
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {success ? "Payment Successful" : "Payment Failed"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {success
                ? "Your payment was processed successfully."
                : "Your payment could not be processed. Please try again."}
            </Typography>
            {!success && merchantOrderId && (
              <Button
                variant="contained"
                href={`/booking/checkout/${merchantOrderId}`}
                sx={{ borderRadius: 999, px: 4, fontWeight: 700 }}
              >
                Try Again
              </Button>
            )}
            <Button variant="outlined" href="/bookings" sx={{ borderRadius: 999, px: 4, fontWeight: 700 }}>
              My Bookings
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

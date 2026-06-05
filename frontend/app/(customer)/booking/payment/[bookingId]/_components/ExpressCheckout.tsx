"use client";

import { Box, Button, Typography, Stack, Divider } from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";

interface ExpressCheckoutProps {
  readonly enableApplePay: boolean;
  readonly enableGooglePay: boolean;
}

export default function ExpressCheckout({ enableApplePay, enableGooglePay }: ExpressCheckoutProps) {
  if (!enableApplePay && !enableGooglePay) {
    return null;
  }

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 1.5, display: "block", mb: 2 }}
      >
        Express Checkout
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {enableApplePay && (
          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: "common.black",
              color: "common.white",
              height: 56,
              borderRadius: 2,
              "&:hover": {
                bgcolor: "common.black",
                opacity: 0.9,
              },
            }}
          >
            <Typography variant="button" sx={{ fontWeight: 700 }}>
              Apple Pay
            </Typography>
          </Button>
        )}

        {enableGooglePay && (
          <Button
            variant="outlined"
            fullWidth
            sx={{
              bgcolor: "common.white",
              color: "text.primary",
              borderColor: "divider",
              height: 56,
              borderRadius: 2,
              "&:hover": {
                bgcolor: "action.hover",
                borderColor: "divider",
              },
            }}
          >
            <Box
              component="img"
              src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
              alt="Google"
              sx={{ height: 24, mr: 1 }}
            />
            <Typography variant="button" sx={{ fontWeight: 700 }}>
              Pay
            </Typography>
          </Button>
        )}
      </Stack>

      <Box sx={{ display: "flex", alignItems: "center", py: 2 }}>
        <Divider sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", px: 2, letterSpacing: 1 }}>
          OR
        </Typography>
        <CreditCardIcon sx={{ color: "text.secondary", fontSize: 20, mr: 2 }} />
        <Divider sx={{ flexGrow: 1 }} />
      </Box>
    </Box>
  );
}

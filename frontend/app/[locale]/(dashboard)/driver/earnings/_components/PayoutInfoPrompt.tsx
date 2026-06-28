"use client";

import { Box, Button, Card, CardContent, Typography, alpha, useTheme } from "@mui/material";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { useRouter } from "next/navigation";

interface PayoutInfoPromptProps {
  variant: "missing" | "unverified";
  labels: {
    payoutInfoMissing: string;
    payoutInfoNotVerified: string;
    completePayoutSetup: string;
    goToProfile: string;
  };
}

export default function PayoutInfoPrompt({ variant, labels }: PayoutInfoPromptProps) {
  const theme = useTheme();
  const router = useRouter();

  const title = variant === "missing" ? labels.payoutInfoMissing : labels.payoutInfoNotVerified;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "warning.main",
        bgcolor: alpha(theme.palette.warning.main, 0.04),
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 3 },
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <WarningAmberOutlinedIcon sx={{ fontSize: 32, color: "warning.main", flexShrink: 0 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {title}
          </Typography>
          {variant === "missing" && (
            <Typography variant="caption" color="text.secondary">
              {labels.completePayoutSetup}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          color="warning"
          size="small"
          onClick={() => {
            router.push("/driver/profile");
          }}
          sx={{ flexShrink: 0, fontWeight: 700 }}
        >
          {labels.goToProfile}
        </Button>
      </CardContent>
    </Card>
  );
}

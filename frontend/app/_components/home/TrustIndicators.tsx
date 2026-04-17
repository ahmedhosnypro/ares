"use client";

import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SecurityIcon from "@mui/icons-material/Security";
import type { PublicLandingValueProp } from "@/utils/public-data";
import type { ReactNode } from "react";

interface TrustIndicatorsProps {
  readonly valueProps?: readonly PublicLandingValueProp[];
}

interface TrustIndicatorItem {
  readonly icon: ReactNode;
  readonly text: string;
  readonly description?: string;
  readonly accent?: string;
}

export default function TrustIndicators({ valueProps = [] }: Readonly<TrustIndicatorsProps>) {
  const defaultIndicators: readonly TrustIndicatorItem[] = [
    { icon: <CancelIcon />, text: "Free Cancellation" },
    { icon: <CheckCircleIcon />, text: "No Hidden Fees" },
    { icon: <SupportAgentIcon />, text: "24/7 Support" },
    { icon: <SecurityIcon />, text: "Secure Booking" },
  ];
  const indicatorIcons: readonly ReactNode[] = [
    <CheckCircleIcon key="check" />,
    <SupportAgentIcon key="support" />,
    <SecurityIcon key="security" />,
  ];
  const dynamicIndicators: readonly TrustIndicatorItem[] = valueProps.map((item, index) => ({
    icon: indicatorIcons[index % indicatorIcons.length],
    text: item.title,
    description: item.description,
    accent: item.accent,
  }));
  const indicators = dynamicIndicators.length > 0 ? dynamicIndicators : defaultIndicators;
  const hasDynamicContent = dynamicIndicators.length > 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 8 }}>
      <Grid container spacing={2} justifyContent="center" alignItems="stretch">
        {indicators.map((item, idx) => (
          <Grid size={{ xs: 12, sm: hasDynamicContent ? 4 : 3 }} key={idx}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{
                py: 1.5,
                px: 2,
                bgcolor: "background.paper",
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                minHeight: 124,
                height: "100%",
              }}
            >
              <Box sx={{ color: "success.main", display: "flex" }}>{item.icon}</Box>
              <Box>
                <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                  {item.text}
                </Typography>
                {item.description ? (
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                ) : null}
                {item.accent ? (
                  <Typography variant="caption" color="primary.main" fontWeight={700} display="block">
                    {item.accent}
                  </Typography>
                ) : null}
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

"use client";

import { Box, Container, Typography, alpha } from "@mui/material";

interface HeroSectionProps {
  readonly heroTitle: string;
  readonly heroDescription: string;
}

export default function HeroSection({ heroTitle, heroDescription }: HeroSectionProps) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: "60vh", md: "80vh" },
        minHeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        color: "common.white",
        textAlign: "center",
        bgcolor: "#050708", // Darkest theme color as baseline
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: theme => theme.palette.overlay.dark,
          zIndex: 1,
        },
      }}
    >
      <Box
        component="video"
        autoPlay
        loop
        muted
        playsInline
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
          bgcolor: "#050708",
        }}
      >
        <source src="/cover.mp4" type="video/mp4" />
      </Box>

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 2, px: 3 }}>
        <Typography
          variant="h2"
          sx={{
            mb: 2,
            fontWeight: 800,
            textShadow: theme => `0 2px 10px ${alpha(theme.palette.common.black, 0.5)}`,
            fontSize: { xs: "2.5rem", md: "4.5rem" },
          }}
        >
          {heroTitle}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            opacity: 0.9,
            textShadow: theme => `0 1px 5px ${alpha(theme.palette.common.black, 0.5)}`,
            mb: 4,
            fontWeight: 400,
            fontSize: { xs: "1rem", md: "1.5rem" },
          }}
        >
          {heroDescription}
        </Typography>
      </Container>
    </Box>
  );
}

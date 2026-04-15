"use client";

import { Box, Container, Typography } from "@mui/material";

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
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: "rgba(0, 0, 0, 0.4)",
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
        }}
      >
        <source src="/cover.mp4" type="video/mp4" />
      </Box>

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 2, px: 3 }}>
        <Typography
          variant="h2"
          component="h1"
          fontWeight={800}
          sx={{
            mb: 2,
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            fontSize: { xs: "2.5rem", md: "4.5rem" },
          }}
        >
          {heroTitle}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            opacity: 0.9,
            textShadow: "0 1px 5px rgba(0,0,0,0.5)",
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

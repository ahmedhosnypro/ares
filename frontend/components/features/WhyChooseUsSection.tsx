"use client";

import {
  Avatar,
  Box,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";

export default function WhyChooseUsSection() {
  // Consolidated features - removed redundancy, kept the strongest selling points
  const features = [
    {
      title: "No Hidden Charges",
      icon: <CheckCircleRoundedIcon fontSize="large" />,
      desc: "Pay exactly what you see. Transparent pricing with no surprises at checkout.",
    },
    {
      title: "Verified Reviews",
      icon: <StarRoundedIcon fontSize="large" />,
      desc: "Trust honest feedback from real customers who've rented before you.",
    },
    {
      title: "Premium Fleet",
      icon: <DirectionsCarRoundedIcon fontSize="large" />,
      desc: "Access a wide range of well-maintained vehicles for every journey.",
    },
    {
      title: "Flexible Plans",
      icon: <SettingsSuggestRoundedIcon fontSize="large" />,
      desc: "Choose rental options that fit your schedule and budget perfectly.",
    },
    {
      title: "24/7 Support",
      icon: <SupportAgentRoundedIcon fontSize="large" />,
      desc: "Our customer care team is always here to assist you, anytime.",
    },
    {
      title: "Instant Booking",
      icon: <PublicRoundedIcon fontSize="large" />,
      desc: "Book online in seconds and get instant confirmation for your rental.",
    },
  ];

  return (
    <Box 
      sx={{ 
        bgcolor: "grey.50", 
        py: { xs: 6, md: 10 }, 
        px: { xs: 3, md: 6 }, 
        mx: { xs: -2, md: -3 }, 
        borderRadius: 3, // Reduced from 6 (48px) to 3 (24px) for structured look
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Typography 
          variant="h3" 
          fontWeight="bold" 
          textAlign="center" 
          mb={2}
          sx={{ fontSize: { xs: "2rem", md: "3rem" } }}
        >
          Why choose us?
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          textAlign="center" 
          mb={8}
          sx={{ maxWidth: 600, mx: "auto" }}
        >
          We combine transparency, quality, and convenience to make your car rental experience seamless.
        </Typography>
        
        {/* 3x2 Grid for better readability and breathing room */}
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {features.map((feature, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Stack 
                spacing={2} 
                alignItems="center" 
                textAlign="center"
                sx={{
                  height: "100%",
                  p: 3,
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  }
                }}
              >
                {/* Consistent icon styling - no pill borders */}
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    boxShadow: 2,
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  sx={{ minHeight: 32 }} // Consistent title height
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {feature.desc}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

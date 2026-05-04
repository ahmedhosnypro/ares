"use client";

import Link from "next/link";
import Image from "next/image";
import { Box, Button, Container, Divider, Grid, Stack, TextField, Typography, Link as MuiLink } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export default function Footer() {
  const topCities = ["Cairo", "Alexandria", "Giza", "Sharm El Sheikh", "Hurghada", "Luxor", "Aswan", "Port Said"];

  const fleetTypes = [
    "Economy Cars",
    "Compact Cars",
    "Mid-Size Sedans",
    "SUVs",
    "Luxury Vehicles",
    "Vans & Minivans",
    "Electric Vehicles",
    "Convertibles",
  ];

  const company = [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Blog", href: "/blog" },
    { label: "Partnerships", href: "/partnerships" },
  ];

  const support = [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
    { label: "Booking Guide", href: "/guide" },
    { label: "Cancellation Policy", href: "/cancellation" },
  ];

  const legal = [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Accessibility", href: "/accessibility" },
  ];

  const paymentMethods = ["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay"];

  return (
    <Box component="footer" sx={{ bgcolor: "footer.background", color: "footer.text", pt: 8, pb: 4 }}>
      <Container maxWidth="xl">
        {/* Newsletter Section */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderRadius: 2,
            p: { xs: 4, md: 6 },
            mb: 8,
          }}
        >
          <Grid container spacing={4} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  Subscribe to our newsletter
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Get exclusive deals, travel tips, and the latest updates delivered to your inbox.
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  id="newsletter-email-input"
                  fullWidth
                  placeholder="Enter your email"
                  variant="outlined"
                  sx={{
                    bgcolor: "background.paper",
                    borderRadius: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  sx={{
                    borderRadius: 1.5,
                    px: 4,
                    fontWeight: "bold",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Subscribe
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Main Footer Content */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Company Info */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  position: "relative",
                  width: 140,
                  height: 45,
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Image
                  src="/img/favicon/logo_transparent.png"
                  alt="Ares Logo"
                  fill
                  sizes="140px"
                  style={{
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                    mixBlendMode: "screen",
                  }}
                />
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.7 }}>
              Your trusted partner for car rentals worldwide. Quality vehicles, transparent pricing, and exceptional
              service.
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <PhoneIcon fontSize="small" />
                <Typography variant="body2">+20 123 456 7890</Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <EmailIcon fontSize="small" />
                <Typography variant="body2">support@ares-rentals.com</Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <LocationOnIcon fontSize="small" />
                <Typography variant="body2">Cairo, Egypt</Typography>
              </Stack>
            </Stack>
          </Grid>

          {/* Top Cities */}
          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="footer.title" gutterBottom>
              Top Cities
            </Typography>
            <Stack spacing={1}>
              {topCities.map(city => (
                <MuiLink
                  key={city}
                  href={`/search?city=${city}`}
                  component={Link}
                  color="inherit"
                  underline="hover"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {city}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          {/* Fleet Types */}
          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="footer.title" gutterBottom>
              Fleet Types
            </Typography>
            <Stack spacing={1}>
              {fleetTypes.slice(0, 6).map(type => (
                <MuiLink
                  key={type}
                  href={`/search?type=${type}`}
                  component={Link}
                  color="inherit"
                  underline="hover"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {type}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          {/* Company */}
          <Grid size={{ xs: 6, sm: 4, md: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="footer.title" gutterBottom>
              Company
            </Typography>
            <Stack spacing={1}>
              {company.map(item => (
                <MuiLink
                  key={item.label}
                  href={item.href}
                  component={Link}
                  color="inherit"
                  underline="hover"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          {/* Support */}
          <Grid size={{ xs: 6, sm: 4, md: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="footer.title" gutterBottom>
              Support
            </Typography>
            <Stack spacing={1}>
              {support.map(item => (
                <MuiLink
                  key={item.label}
                  href={item.href}
                  component={Link}
                  color="inherit"
                  underline="hover"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          {/* Legal */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="footer.title" gutterBottom>
              Legal
            </Typography>
            <Stack spacing={1}>
              {legal.map(item => (
                <MuiLink
                  key={item.label}
                  href={item.href}
                  component={Link}
                  color="inherit"
                  underline="hover"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: "footer.divider", mb: 4 }} />

        {/* Bottom Footer */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ justifyContent: "space-between", alignItems: "center" }}
          spacing={3}
        >
          {/* Copyright */}
          <Typography variant="body2" color="footer.text">
            © {new Date().getFullYear()} ARES Rentals. All rights reserved.
          </Typography>

          {/* Payment Methods */}
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="caption" color="footer.text">
              We accept:
            </Typography>
            {paymentMethods.map(method => (
              <Box
                key={method}
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: "footer.socialBg",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "footer.divider",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: "bold" }} color="footer.socialText">
                  {method}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* Social Media */}
          <Stack direction="row" spacing={1}>
            {[
              { icon: <FacebookIcon />, href: "#" },
              { icon: <TwitterIcon />, href: "#" },
              { icon: <InstagramIcon />, href: "#" },
              { icon: <LinkedInIcon />, href: "#" },
            ].map((social, idx) => (
              <Box
                key={idx}
                component="a"
                href={social.href}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: "footer.socialBg",
                  color: "footer.socialText",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {social.icon}
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  Link as MuiLink,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LanguageIcon from "@mui/icons-material/Language";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(null);
  const [currencyAnchor, setCurrencyAnchor] = useState<null | HTMLElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const navigationLinks = [
    { label: "Fleet", href: "/fleet" },
    { label: "Locations", href: "/locations" },
    { label: "Offers & Deals", href: "/offers" },
    { label: "About Us", href: "/about" },
  ];

  const languages = [
    { code: "EN", label: "English" },
    { code: "AR", label: "العربية" },
    { code: "FR", label: "Français" },
  ];

  const currencies = [
    { code: "USD", label: "USD - US Dollar", symbol: "$" },
    { code: "EGP", label: "EGP - Egyptian Pound", symbol: "E£" },
    { code: "EUR", label: "EUR - Euro", symbol: "€" },
    { code: "GBP", label: "GBP - British Pound", symbol: "£" },
  ];

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchor(event.currentTarget);
  };

  const handleCurrencyClick = (event: React.MouseEvent<HTMLElement>) => {
    setCurrencyAnchor(event.currentTarget);
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    setLanguageAnchor(null);
  };

  const handleCurrencySelect = (code: string) => {
    setSelectedCurrency(code);
    setCurrencyAnchor(null);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(15, 91, 91, 0.95)",
          backdropFilter: "blur(12px)",
          transition: "all 0.3s ease",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
            {/* Left: Brand Identity */}
            <MuiLink
              href="/"
              component={Link}
              underline="none"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mr: 4,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: { xs: 100, sm: 120 },
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                <Image
                  src="/img/favicon/logo_transparent.png"
                  alt="Ares Logo"
                  fill
                  sizes="(max-width: 600px) 100px, 120px"
                  style={{ objectFit: "contain" }}
                  priority
                />
              </Box>
            </MuiLink>

            {/* Center: Primary Navigation (Desktop) */}
            <Box
              sx={{
                flexGrow: 1,
                display: { xs: "none", md: "flex" },
                gap: 1,
                justifyContent: "center",
              }}
            >
              {navigationLinks.map((link) => (
                <Button
                  key={link.label}
                  component={Link}
                  href={link.href}
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontSize: "1rem",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.15)",
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>

            {/* Right: Utility & Conversion */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
              {/* Language Selector */}
              <Button
                onClick={handleLanguageClick}
                startIcon={<LanguageIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                  display: { xs: "none", sm: "flex" },
                  borderRadius: 1.5,
                  px: 2,
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                  },
                }}
              >
                {selectedLanguage}
              </Button>
              <Menu
                anchorEl={languageAnchor}
                open={Boolean(languageAnchor)}
                onClose={() => { setLanguageAnchor(null); }}
                slotProps={{
                  paper: { sx: { borderRadius: 1.5, minWidth: 150 } }
                }}
              >
                {languages.map((lang) => (
                  <MenuItem
                    key={lang.code}
                    onClick={() => { handleLanguageSelect(lang.code); }}
                    selected={selectedLanguage === lang.code}
                  >
                    {lang.label}
                  </MenuItem>
                ))}
              </Menu>

              {/* Currency Selector */}
              <Button
                onClick={handleCurrencyClick}
                startIcon={<AttachMoneyIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                  display: { xs: "none", sm: "flex" },
                  borderRadius: 1.5,
                  px: 2,
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                  },
                }}
              >
                {selectedCurrency}
              </Button>
              <Menu
                anchorEl={currencyAnchor}
                open={Boolean(currencyAnchor)}
                onClose={() => { setCurrencyAnchor(null); }}
                slotProps={{
                  paper: { sx: { borderRadius: 1.5, minWidth: 200 } }
                }}
              >
                {currencies.map((curr) => (
                  <MenuItem
                    key={curr.code}
                    onClick={() => { handleCurrencySelect(curr.code); }}
                    selected={selectedCurrency === curr.code}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={selectedCurrency === curr.code ? "bold" : "normal"}>
                        {curr.symbol}
                      </Typography>
                      <Typography variant="body2">{curr.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Menu>

              {/* Authentication Buttons */}
              <Button
                component={Link}
                href="/sign-in"
                variant="text"
                sx={{
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                  display: { xs: "none", md: "inline-flex" },
                  borderRadius: 1.5,
                  px: 2,
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/sign-up"
                variant="contained"
                sx={{
                  bgcolor: "secondary.main",
                  color: "text.primary",
                  fontWeight: "bold",
                  textTransform: "none",
                  display: { xs: "none", md: "inline-flex" },
                  borderRadius: 1.5,
                  px: 3,
                  boxShadow: "0 4px 12px rgba(184, 134, 11, 0.3)",
                  "&:hover": {
                    bgcolor: "secondary.dark",
                    boxShadow: "0 6px 16px rgba(184, 134, 11, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Register
              </Button>

              {/* Mobile Menu Button */}
              <IconButton
                onClick={() => { setMobileMenuOpen(true); }}
                sx={{
                  display: { xs: "flex", md: "none" },
                  color: "white",
                }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => { setMobileMenuOpen(false); }}
        slotProps={{
          paper: { sx: { width: { xs: "100%", sm: 320 } } }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box
              sx={{
                position: "relative",
                width: 100,
                height: 32,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Image
                src="/img/favicon/logo_transparent.png"
                alt="Ares Logo"
                fill
                sizes="100px"
                style={{ objectFit: "contain" }}
              />
            </Box>
            <IconButton onClick={() => { setMobileMenuOpen(false); }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Mobile Navigation Links */}
          <List>
            {navigationLinks.map((link) => (
              <ListItem key={link.label} disablePadding>
                <ListItemButton
                  component={Link}
                  href={link.href}
                  onClick={() => { setMobileMenuOpen(false); }}
                  sx={{ borderRadius: 1.5, mb: 0.5 }}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Mobile Localization */}
          <Stack spacing={2} sx={{ px: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Language
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    size="small"
                    variant={selectedLanguage === lang.code ? "contained" : "outlined"}
                    onClick={() => { handleLanguageSelect(lang.code); }}
                    sx={{ borderRadius: 1.5 }}
                  >
                    {lang.code}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Currency
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {currencies.map((curr) => (
                  <Button
                    key={curr.code}
                    size="small"
                    variant={selectedCurrency === curr.code ? "contained" : "outlined"}
                    onClick={() => { handleCurrencySelect(curr.code); }}
                    sx={{ borderRadius: 1.5 }}
                  >
                    {curr.code}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Mobile Authentication */}
          <Stack spacing={2} sx={{ px: 2 }}>
            <Button
              component={Link}
              href="/sign-in"
              variant="outlined"
              fullWidth
              onClick={() => { setMobileMenuOpen(false); }}
              sx={{ borderRadius: 1.5, py: 1.5 }}
            >
              Sign In
            </Button>
            <Button
              component={Link}
              href="/sign-up"
              variant="contained"
              fullWidth
              onClick={() => { setMobileMenuOpen(false); }}
              sx={{ borderRadius: 1.5, py: 1.5, fontWeight: "bold" }}
            >
              Register
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

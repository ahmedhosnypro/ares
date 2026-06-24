"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { performLogoutCleanup } from "@/utils/auth-cleanup";
import type { Session } from "next-auth";
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
  Avatar,
  ListItemIcon,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { toImageUrl } from "@/utils/image-url";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import CheckoutIndicator from "@/components/layout/CheckoutIndicator";
import NotificationsPanel from "@/app/_components/NotificationsPanel";

interface HeaderClientProps {
  readonly session: Session | null;
}

export default function HeaderClient({ session: initialSession }: HeaderClientProps) {
  const { data: clientSession, status } = useSession();
  const session = status === "loading" ? initialSession : clientSession;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyAnchor, setCurrencyAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const navigationLinks = [
    { label: "Search", href: "/search" },
    { label: "Locations", href: "/locations" },
    { label: "Offers & Deals", href: "/offers" },
    { label: "About Us", href: "/about" },
  ];

  const currencies = [
    { code: "USD", label: "USD - US Dollar", symbol: "$" },
    { code: "EGP", label: "EGP - Egyptian Pound", symbol: "E£" },
    { code: "EUR", label: "EUR - Euro", symbol: "€" },
    { code: "GBP", label: "GBP - British Pound", symbol: "£" },
  ];

  const handleCurrencyClick = (event: React.MouseEvent<HTMLElement>) => {
    setCurrencyAnchor(event.currentTarget);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCurrencySelect = (code: string) => {
    setSelectedCurrency(code);
    setCurrencyAnchor(null);
  };

  const handleSignOut = async () => {
    setUserMenuAnchor(null);
    performLogoutCleanup();
    await signOut({ callbackUrl: "/" });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!session?.user) return "U";
    const firstName = session.user.firstName || "";
    const lastName = session.user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!session?.user) return "User";
    const firstName = session.user.firstName || "";
    const lastName = session.user.lastName || "";
    return `${firstName} ${lastName}`.trim() || session.user.email || "User";
  };

  // Check if user has admin/supplier/driver/inspector roles
  const roles = session?.user.roles || [];
  const isAdmin = roles.includes("Admin");
  const isSupplier = roles.includes("Supplier");
  const isDriver = roles.includes("Driver");
  const isInspector = roles.includes("Inspector");
  const hasDashboard = isAdmin || isSupplier || isDriver || isInspector;

  const getDashboardHref = () => {
    if (isAdmin) return "/admin";
    if (isSupplier) return "/supplier/dashboard";
    if (isDriver) return "/driver/dashboard";
    if (isInspector) return "/inspector";
    return "/";
  };

  const getProfileHref = () => {
    if (isDriver) return "/driver/profile";
    if (isInspector) return "/inspector/profile";
    return "/account/profile";
  };

  const pathname = usePathname();
  const isDashboardRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/supplier") || pathname.startsWith("/inspector");

  if (isDashboardRoute) {
    return null;
  }

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "header.background",
          backdropFilter: "blur(12px)",
          transition: "all 0.3s ease",
          borderBottom: "1px solid",
          borderColor: "header.border",
          // Use a dark background during the preload phase if we're in dark mode
          'html[data-theme="dark"] .preload &': {
            bgcolor: "background.default",
          },
        }}
      >
        <Container maxWidth="lg" sx={{ maxWidth: { xs: "100%", lg: "1200px" } }}>
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
                  style={{
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                    mixBlendMode: "screen",
                  }}
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
              {navigationLinks.map(link => (
                <Button
                  key={link.label}
                  component={Link}
                  href={link.href}
                  sx={{
                    color: "common.white",
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontSize: "1rem",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "header.buttonHover",
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>

            {/* Right: Utility & Conversion */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: "auto" }}>
              {/* Theme Switcher */}
              <ThemeSwitcher color="inherit" size="medium" />

              {/* Pending checkout indicator */}
              <CheckoutIndicator />

              {/* Notifications bell — only shown to authenticated users */}
              {session && (
                <Box sx={{ color: "common.white", display: "flex", alignItems: "center" }}>
                  <NotificationsPanel iconColor="inherit" />
                </Box>
              )}

              {/* Currency Selector */}
              <Button
                onClick={handleCurrencyClick}
                startIcon={<AttachMoneyIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{
                  color: "common.white",
                  fontWeight: 600,
                  textTransform: "none",
                  display: { xs: "none", sm: "flex" },
                  borderRadius: 1.5,
                  px: 2,
                  "&:hover": {
                    bgcolor: "header.buttonHover",
                  },
                }}
              >
                {selectedCurrency}
              </Button>
              <Menu
                anchorEl={currencyAnchor}
                open={Boolean(currencyAnchor)}
                onClose={() => {
                  setCurrencyAnchor(null);
                }}
                slotProps={{
                  paper: { sx: { borderRadius: 1.5, minWidth: 200 } },
                }}
              >
                {currencies.map(curr => (
                  <MenuItem
                    key={curr.code}
                    onClick={() => {
                      handleCurrencySelect(curr.code);
                    }}
                    selected={selectedCurrency === curr.code}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontWeight: selectedCurrency === curr.code ? "bold" : "normal" }}>
                        {curr.symbol}
                      </Typography>
                      <Typography variant="body2">{curr.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Menu>

              {/* Authentication: Conditional Rendering */}
              {session ? (
                // Logged In: Show Avatar with Dropdown
                <>
                  <IconButton
                    onClick={handleUserMenuClick}
                    sx={{
                      display: { xs: "none", md: "flex" },
                      ml: 1,
                      transition: "transform 0.2s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    <Avatar
                      src={toImageUrl(session.user.image) ?? undefined}
                      alt={getUserDisplayName()}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "secondary.main",
                        color: "secondary.contrastText",
                        fontWeight: "bold",
                        border: "2px solid",
                        borderColor: "header.avatarBorder",
                      }}
                    >
                      {getUserInitials()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => {
                      setUserMenuAnchor(null);
                    }}
                    slotProps={{
                      paper: { sx: { borderRadius: 1.5, minWidth: 220, mt: 1 } },
                    }}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  >
                    {/* User Info Header */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }} noWrap>
                        {getUserDisplayName()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {session.user.email}
                      </Typography>
                    </Box>

                    {/* Menu Items */}
                    <MenuItem
                      component={Link}
                      href={getProfileHref()}
                      onClick={() => {
                        setUserMenuAnchor(null);
                      }}
                    >
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>My Profile</ListItemText>
                    </MenuItem>

                    {!isAdmin && (
                      <MenuItem
                        component={Link}
                        href="/bookings"
                        onClick={() => {
                          setUserMenuAnchor(null);
                        }}
                      >
                        <ListItemIcon>
                          <BookmarksIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>My Bookings</ListItemText>
                      </MenuItem>
                    )}

                    {hasDashboard && (
                      <MenuItem
                        component={Link}
                        href={getDashboardHref()}
                        onClick={() => {
                          setUserMenuAnchor(null);
                        }}
                      >
                        <ListItemIcon>
                          <DashboardIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Dashboard</ListItemText>
                      </MenuItem>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <MenuItem
                      onClick={() => {
                        void handleSignOut();
                      }}
                      sx={{ color: "error.main" }}
                    >
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText>Sign Out</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                // Not Logged In: Show Sign In / Register Buttons
                <>
                  <Button
                    component={Link}
                    href="/sign-in"
                    variant="text"
                    sx={{
                      color: "common.white",
                      fontWeight: 600,
                      textTransform: "none",
                      display: { xs: "none", md: "inline-flex" },
                      borderRadius: 1.5,
                      px: 2,
                      "&:hover": {
                        bgcolor: "header.buttonHover",
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
                      color: "secondary.contrastText",
                      fontWeight: "bold",
                      textTransform: "none",
                      display: { xs: "none", md: "inline-flex" },
                      borderRadius: 1.5,
                      px: 3,
                      boxShadow: theme => theme.palette.shadow.button,
                      "&:hover": {
                        bgcolor: "secondary.dark",
                        boxShadow: theme => theme.palette.shadow.buttonHover,
                        transform: "translateY(-1px)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    Register
                  </Button>
                </>
              )}

              {/* Mobile Menu Button */}
              <IconButton
                onClick={() => {
                  setMobileMenuOpen(true);
                }}
                sx={{
                  display: { xs: "flex", md: "none" },
                  color: "common.white",
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
        onClose={() => {
          setMobileMenuOpen(false);
        }}
        slotProps={{
          paper: { sx: { width: { xs: "100%", sm: 320 } } },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
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
                style={{ objectFit: "contain", mixBlendMode: "multiply" }}
              />
            </Box>
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <CheckoutIndicator />
              <IconButton
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Mobile User Section */}
          {session && (
            <>
              <Box sx={{ px: 2, py: 2, bgcolor: "background.default", borderRadius: 2, mb: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    src={toImageUrl(session.user.image) ?? undefined}
                    alt={getUserDisplayName()}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: "primary.main",
                      fontWeight: "bold",
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }} noWrap>
                      {getUserDisplayName()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {session.user.email}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <List>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={getProfileHref()}
                    onClick={() => {
                      setMobileMenuOpen(false);
                    }}
                    sx={{ borderRadius: 1.5, mb: 0.5 }}
                  >
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText primary="My Profile" />
                  </ListItemButton>
                </ListItem>
                {!isAdmin && (
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      href="/bookings"
                      onClick={() => {
                        setMobileMenuOpen(false);
                      }}
                      sx={{ borderRadius: 1.5, mb: 0.5 }}
                    >
                      <ListItemIcon>
                        <BookmarksIcon />
                      </ListItemIcon>
                      <ListItemText primary="My Bookings" />
                    </ListItemButton>
                  </ListItem>
                )}
                {hasDashboard && (
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      href={getDashboardHref()}
                      onClick={() => {
                        setMobileMenuOpen(false);
                      }}
                      sx={{ borderRadius: 1.5, mb: 0.5 }}
                    >
                      <ListItemIcon>
                        <DashboardIcon />
                      </ListItemIcon>
                      <ListItemText primary="Dashboard" />
                    </ListItemButton>
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* Mobile Navigation Links */}
          <List>
            {navigationLinks.map(link => (
              <ListItem key={link.label} disablePadding>
                <ListItemButton
                  component={Link}
                  href={link.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
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
                Theme
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ThemeSwitcher size="small" />
                <Typography variant="body2" color="text.secondary">
                  Toggle theme
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Currency
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {currencies.map(curr => (
                  <Button
                    key={curr.code}
                    size="small"
                    variant={selectedCurrency === curr.code ? "contained" : "outlined"}
                    onClick={() => {
                      handleCurrencySelect(curr.code);
                    }}
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
            {session ? (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  void handleSignOut();
                }}
                startIcon={<LogoutIcon />}
                sx={{ borderRadius: 1.5, py: 1.5 }}
              >
                Sign Out
              </Button>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/sign-in"
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  sx={{ borderRadius: 1.5, py: 1.5 }}
                >
                  Sign In
                </Button>
                <Button
                  component={Link}
                  href="/sign-up"
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  sx={{ borderRadius: 1.5, py: 1.5, fontWeight: "bold" }}
                >
                  Register
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

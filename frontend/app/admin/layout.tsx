"use client";

import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  CircularProgress,
  alpha,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  EventAvailable as BookingIcon,
  People as UsersIcon,
  Storefront as SupplierIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  MonetizationOn as PricingIcon,

  Public as CountriesIcon,
  Place as LocationsIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
  ExitToApp as ExitIcon,
} from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import NotificationsBell from "./_components/NotificationsBell";

const drawerWidth = 260;

// Sidebar (dark navy) palette — kept local so we don't touch the global theme.
const SIDEBAR_BG = "#0f172a"; // slate-900
const SIDEBAR_TEXT = "#cbd5e1"; // slate-300
const SIDEBAR_TEXT_MUTED = "#94a3b8"; // slate-400
const SIDEBAR_ACTIVE_BG = "#3b82f6"; // blue-500
const SIDEBAR_HOVER_BG = "#1e293b"; // slate-800
const SIDEBAR_DIVIDER = "#1e293b";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
  { text: "Bookings", icon: <BookingIcon />, path: "/admin/bookings" },
  { text: "Vehicles", icon: <CarIcon />, path: "/admin/cars" },
  { text: "Suppliers", icon: <SupplierIcon />, path: "/admin/suppliers" },
  { text: "Users", icon: <UsersIcon />, path: "/admin/users" },
  { text: "Locations", icon: <LocationsIcon />, path: "/admin/locations" },
  { text: "Countries", icon: <CountriesIcon />, path: "/admin/countries" },
  { text: "Pricing", icon: <PricingIcon />, path: "/admin/pricing" },
  { text: "Notifications", icon: <NotificationsIcon />, path: "/admin/notifications" },
  { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
];

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    // إيقاف التوجيه التلقائي لمسح حالة الجلسة تمامًا
    await signOut({ redirect: false });
    // إجبار المتصفح على إعادة التحميل والانتقال للصفحة الرئيسية لمسح الكاش
    window.location.href = "/";
  };

  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!session) return null;

  if (!session.user.id) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">User ID missing from session. Please sign in again.</Typography>
      </Box>
    );
  }

  const user = session.user;
  const userName = user.firstName ? `${user.firstName} ${user.lastName}` : "Admin User";
  const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : "A";

  // Derive the page title from the currently active sidebar item (purely visual; no logic change).
  const activeMenuItem = menuItems.find(item => item.path === pathname);
  const pageTitle = activeMenuItem?.text ?? "Dashboard";

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: SIDEBAR_BG, color: SIDEBAR_TEXT }}>
      <Toolbar sx={{ px: 2.5, display: "flex", alignItems: "center", gap: 1.5, height: 88 }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            color: "inherit",
            width: "100%",
          }}
        >
          {/* Real website logo (same asset as the public Header) — auto-inverted to read on the dark sidebar */}
          <Box
            sx={{
              position: "relative",
              flexShrink: 0,
              width: 130,
              height: 40,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Image
              src="/img/favicon/logo_transparent.png"
              alt="Ares Logo"
              fill
              sizes="130px"
              priority
              style={{
                objectFit: "contain",
                objectPosition: "left center",
                filter: "brightness(0) invert(1)",
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: SIDEBAR_TEXT_MUTED,
              fontSize: "0.62rem",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              ml: "auto",
              display: { xs: "none", sm: "block" },
            }}
          >
            Admin
          </Typography>
        </Link>
      </Toolbar>
      <Divider sx={{ mb: 1.5, borderColor: SIDEBAR_DIVIDER }} />
      <List sx={{ px: 1.5, flex: 1, overflowY: "auto" }}>
        {menuItems.map(item => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Link href={item.path} passHref style={{ width: "100%", textDecoration: "none", color: "inherit" }}>
                <ListItemButton
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    py: 1.1,
                    px: 1.5,
                    bgcolor: isActive ? SIDEBAR_ACTIVE_BG : "transparent",
                    color: isActive ? "#fff" : SIDEBAR_TEXT,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: isActive ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG,
                      color: "#fff",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "0.92rem",
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 1.5, borderTop: `1px solid ${SIDEBAR_DIVIDER}` }}>
        <Box
          onClick={handleMenu}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            cursor: "pointer",
            p: 1.25,
            borderRadius: 2,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: SIDEBAR_HOVER_BG,
            },
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              width: 40,
              height: 40,
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {userName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: SIDEBAR_TEXT_MUTED,
                fontSize: "0.72rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
            >
              {user.email || user.roles[0] || "Administrator"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                void handleLogout();
              }}
              sx={{ color: SIDEBAR_TEXT_MUTED, "&:hover": { color: "error.main", bgcolor: SIDEBAR_HOVER_BG } }}
            >
              <ExitIcon fontSize="small" />
            </IconButton>
            <KeyboardArrowDownIcon sx={{ color: SIDEBAR_TEXT_MUTED, fontSize: 20 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth.toString()}px)` },
          ml: { md: `${drawerWidth.toString()}px` },
          bgcolor: theme => alpha(theme.palette.background.paper, 0.85),
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ height: 72, gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Hamburger placeholder on desktop (purely decorative — toggles mobile drawer too) */}
          <IconButton
            color="inherit"
            aria-label="toggle menu"
            onClick={handleDrawerToggle}
            sx={{ display: { xs: "none", md: "inline-flex" }, color: "text.secondary" }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              letterSpacing: "-0.5px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {pageTitle}
          </Typography>

          {/* Mobile-only logo (since title takes precedence on desktop) */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", ml: 1 }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <Box sx={{ height: 28, width: 70, position: "relative" }}>
                <Image
                  src="/img/favicon/logo_transparent.png"
                  alt="Ares Logo"
                  fill
                  style={{
                    objectFit: "contain",
                    filter: theme.palette.mode === "dark" ? "none" : "invert(1) brightness(0.5)",
                  }}
                />
              </Box>
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Visual search bar (decorative) */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
              bgcolor: "action.hover",
              borderRadius: 2,
              px: 2,
              py: 0.75,
              width: 280,
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.2s ease",
              "&:focus-within": {
                borderColor: "primary.main",
                bgcolor: "background.paper",
              },
            }}
          >
            <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <Box
              component="input"
              placeholder="Search..."
              sx={{
                border: "none",
                outline: "none",
                bgcolor: "transparent",
                color: "text.primary",
                fontSize: "0.9rem",
                width: "100%",
                "&::placeholder": { color: "text.secondary" },
              }}
            />
          </Box>

          {/* Quick actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ThemeSwitcher />
            {/* Back to site (icon only — desktop) */}
            <IconButton
              component={Link}
              href="/"
              aria-label="back to site"
              sx={{ display: { xs: "none", md: "inline-flex" }, color: "text.secondary" }}
            >
              <HomeIcon />
            </IconButton>
            <IconButton
              onClick={() => {
                void handleLogout();
              }}
              aria-label="logout"
              sx={{ color: "error.main", "&:hover": { bgcolor: "error.lighter" } }}
            >
              <ExitIcon />
            </IconButton>
            <NotificationsBell />
          </Box>
        </Toolbar>
      </AppBar>

      {/* User dropdown menu (anchored to sidebar user section) */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        keepMounted
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 6,
            sx: {
              overflow: "visible",
              filter: theme => `drop-shadow(0px 4px 12px ${alpha(theme.palette.common.black, 0.12)})`,
              mt: -1,
              ml: 1,
              borderRadius: 2,
              minWidth: 220,
              maxWidth: "calc(100vw - 32px)",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            router.push("/account/profile");
          }}
          sx={{ py: 1, borderRadius: 1.5, mx: 1, gap: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: "auto" }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            void handleLogout();
          }}
          sx={{
            py: 1,
            borderRadius: 1.5,
            mx: 1,
            gap: 1.5,
            color: "error.main",
            "&:hover": { bgcolor: "error.lighter" },
          }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: "auto" }}>
            <ExitIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
              bgcolor: SIDEBAR_BG,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
              bgcolor: SIDEBAR_BG,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth.toString()}px)` },
          mt: "72px",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

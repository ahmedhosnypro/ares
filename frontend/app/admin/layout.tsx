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
  Logout as LogoutIcon,
  Public as CountriesIcon,
  Place as LocationsIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";

const drawerWidth = 280;

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
    await signOut({ callbackUrl: "/" });
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

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <Toolbar sx={{ px: 3, display: "flex", alignItems: "center", gap: 2, height: 80 }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: "primary.main",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="primary.contrastText">
              A
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: "900", letterSpacing: "-0.5px", color: "text.primary" }}>
            Ares Admin
          </Typography>
        </Link>
      </Toolbar>
      <Divider sx={{ mb: 2, borderColor: "divider" }} />
      <List sx={{ px: 2, flex: 1, overflowY: "auto" }}>
        {menuItems.map(item => {
          const isActive = pathname === item.path;
          let bgColor = "transparent";
          if (isActive) {
            bgColor = alpha(theme.palette.primary.main, 0.1);
          }
          let hoverBgColor = "action.hover";
          if (isActive) {
            hoverBgColor = alpha(theme.palette.primary.main, 0.15);
          }

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Link href={item.path} passHref style={{ width: "100%", textDecoration: "none", color: "inherit" }}>
                <ListItemButton
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor: bgColor,
                    color: isActive ? "primary.main" : "text.secondary",
                    "&:hover": {
                      bgcolor: hoverBgColor,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? "primary.main" : "inherit", minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "0.95rem",
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
      <Box sx={{ p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              void handleLogout();
            }}
            sx={{
              borderRadius: 2,
              color: "error.main",
              "&:hover": { bgcolor: "error.lighter" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              slotProps={{
                primary: {
                  sx: { fontWeight: 600 },
                },
              }}
            />
          </ListItemButton>
        </ListItem>
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
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ height: 80 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Site Logo/Home Link */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1,
                color: "primary.main",
                "&:hover": { opacity: 0.8 },
              }}
            >
              <HomeIcon />
              <Typography variant="subtitle2" sx={{ fontWeight: "700" }}>
                Back to Site
              </Typography>
            </Box>
            <Box sx={{ display: { xs: "flex", md: "none" }, height: 32, width: 80, position: "relative" }}>
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

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ThemeSwitcher />
            <IconButton color="inherit" sx={{ bgcolor: "action.hover" }}>
              <NotificationsIcon />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={handleMenu}>
              <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "700" }}>
                  {userName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.roles[0] || "Administrator"}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 44, height: 44 }}>
                {initial}
              </Avatar>
            </Box>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              keepMounted
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{ mt: 1 }}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: theme => `drop-shadow(0px 2px 8px ${alpha(theme.palette.common.black, 0.1)})`,
                    mt: 1.5,
                    borderRadius: 2,
                    minWidth: 200,
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                  },
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  handleClose();
                  router.push("/account/profile");
                }}
              >
                <Avatar /> Profile
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  void handleLogout();
                }}
                sx={{ color: "error.main" }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, border: "none" },
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
              borderRight: "1px solid",
              borderColor: "divider",
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
          mt: "80px",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

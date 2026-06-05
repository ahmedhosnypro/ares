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
} from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

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

export default function AdminLayoutClient({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

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

  const userName = session?.user.firstName ? `${session.user.firstName} ${session.user.lastName || ""}` : "Admin User";
  const initial = session?.user.firstName ? session.user.firstName.charAt(0).toUpperCase() : "A";

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <Toolbar sx={{ px: 3, gap: 2, height: 80 }}>
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
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "common.white" }}>
            A
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: "-0.5px" }}>
          Ares Admin
        </Typography>
      </Toolbar>
      <Divider sx={{ mb: 2 }} />
      <List sx={{ px: 2, flex: 1, overflowY: "auto" }}>
        {menuItems.map(item => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Link href={item.path} passHref style={{ width: "100%", textDecoration: "none", color: "inherit" }}>
                <ListItemButton
                  onClick={() => {
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isActive ? "sidebar.activeBg" : "transparent",
                    color: isActive ? "primary.main" : "text.secondary",
                    "&:hover": {
                      bgcolor: isActive ? "sidebar.activeBg" : "action.hover",
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
            sx={{ borderRadius: 2, color: "error.main", "&:hover": { bgcolor: "error.lighter" } }}
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
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "border.main",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ height: 80 }}>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton color="inherit" sx={{ bgcolor: "action.hover" }}>
              <NotificationsIcon />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={handleMenu}>
              <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {userName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session?.user.roles[0] || "Administrator"}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>{initial}</Avatar>
            </Box>
            <Menu
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
                    filter: theme.palette.shadow.card,
                    mt: 1.5,
                    borderRadius: 2,
                    minWidth: 200,
                    border: "1px solid",
                    borderColor: "border.main",
                  },
                },
              }}
            >
              <MenuItem onClick={handleClose}>
                <Avatar sx={{ width: 32, height: 32, mr: 1 }} /> Profile
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
              borderColor: "border.main",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: "80px" }}>
        {children}
      </Box>
    </Box>
  );
}

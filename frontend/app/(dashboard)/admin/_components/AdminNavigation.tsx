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
  Badge,
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
  Logout as LogoutIcon,
  Public as CountriesIcon,
  Place as LocationsIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { performLogoutCleanup } from "@/utils/auth-cleanup";

const drawerWidth = 280;

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
  { text: "Bookings", icon: <BookingIcon />, path: "/admin/bookings" },
  { text: "Vehicles", icon: <CarIcon />, path: "/admin/vehicles" },
  { text: "Suppliers", icon: <SupplierIcon />, path: "/admin/suppliers" },
  { text: "Users", icon: <UsersIcon />, path: "/admin/users" },
  { text: "Locations", icon: <LocationsIcon />, path: "/admin/locations" },
  { text: "Countries", icon: <CountriesIcon />, path: "/admin/countries" },
  { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
];

export default function AdminNavigation({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // الدالة الجديدة لمعالجة تسجيل الخروج بشكل صحيح
  const handleLogout = async () => {
    // إيقاف التوجيه التلقائي لمسح حالة الجلسة تمامًا
    performLogoutCleanup();
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
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (session && !session.user.id) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">User ID missing from session. Please sign in again.</Typography>
      </Box>
    );
  }

  const user = session?.user;
  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "System Admin";
  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : "A";
  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ px: 3, display: "flex", alignItems: "center", gap: 2, height: 80 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            bgcolor: "primary.main",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: theme => `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
          }}
        >
          <Typography variant="h5" color="primary.contrastText" sx={{ fontWeight: "900" }}>
            A
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ color: "text.primary", fontWeight: "900", letterSpacing: "-0.5px" }}>
          ARES Panel
        </Typography>
      </Toolbar>
      <Divider sx={{ mb: 2, mx: 2, opacity: 0.5 }} />
      <List sx={{ px: 2, flex: 1, overflowY: "auto" }}>
        {menuItems.map(item => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <Link href={item.path} passHref style={{ width: "100%", textDecoration: "none" }}>
                <ListItemButton
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isActive ? "primary.main" : "transparent",
                    color: isActive ? "primary.contrastText" : "text.secondary",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: isActive ? "primary.dark" : "action.hover",
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    slotProps={{
                      primary: {
                        sx: { fontWeight: isActive ? 700 : 500, fontSize: "0.95rem" },
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            p: 1.5,
            borderRadius: 2,
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: "action.hover",
              transform: "translateY(-2px)",
            },
          }}
          onClick={e => {
            setAnchorEl(e.currentTarget);
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              fontWeight: "bold",
              width: 44,
              height: 44,
              boxShadow: theme => `0 4px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: "800",
                color: "text.primary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: "700", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}
            >
              {user?.roles[0] || "Admin"}
            </Typography>
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
          bgcolor: theme => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ height: 80 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => {
              setMobileOpen(!mobileOpen);
            }}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              mt: -1,
              ml: 1,
              borderRadius: 2,
              minWidth: 200,
              border: "1px solid",
              borderColor: "divider",
              overflow: "visible",
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                bottom: 15,
                left: -6,
                width: 12,
                height: 12,
                bgcolor: "background.paper",
                transform: "rotate(45deg)",
                borderLeft: "1px solid",
                borderBottom: "1px solid",
                borderColor: "divider",
              },
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {userName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
            {user?.email || "admin@ares.com"}
          </Typography>
        </Box>
        <Divider sx={{ my: 1, opacity: 0.5 }} />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
          }}
          sx={{ py: 1, borderRadius: 2, mx: 1, gap: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: "auto" }}>
            <CarIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            void handleLogout();
          }}
          sx={{
            py: 1,
            borderRadius: 2,
            mx: 1,
            mt: 0.5,
            color: "error.main",
            gap: 1.5,
            "&:hover": { bgcolor: "error.light" },
          }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: "auto" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => {
            setMobileOpen(false);
          }}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, border: "none" } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, border: "none" } }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* التعديل الأهم للـ Layout ليكون Responsive ولا يكسر الشاشات الصغيرة */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth.toString()}px)` },
          maxWidth: "100vw",
          overflowX: "hidden", // لمنع التمرير الأفقي للصفحة بأكملها
          mt: "80px",
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

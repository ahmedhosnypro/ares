"use client";

/**
 * Supplier portal layout.
 *
 * Mirrors the visual language of the existing admin layout (`app/admin/layout.tsx`)
 * intentionally so suppliers see a familiar dashboard experience, but the file is
 * fully isolated — no shared mutable state, no admin imports, and admin code is
 * untouched.
 *
 * Sidebar is intentionally minimal for the first iteration (only "Dashboard").
 * Additional items (Vehicles, Bookings, Earnings, Settings) will be added in
 * follow-up iterations.
 */

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
  Home as HomeIcon,
  Person as PersonIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  ExitToApp as ExitIcon,
} from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";

const drawerWidth = 260;

// Supplier sidebar. Add new entries here as the supplier portal grows;
// do NOT pull from the admin menu list.
const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/supplier/dashboard" },
  { text: "Vehicles", icon: <CarIcon />, path: "/supplier/vehicles" },
];

export default function SupplierLayout({ children }: { readonly children: React.ReactNode }) {
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
    await signOut({ redirect: false });
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
  const userName = user.firstName ? `${user.firstName} ${user.lastName}` : "Supplier";
  const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : "S";

  // Match on exact path OR a sub-route ("/supplier/vehicles/123/edit" still
  // highlights "Vehicles"). Falls back to the Dashboard label for anything
  // else so the AppBar title is never blank.
  const matchesItem = (itemPath: string) => pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  const activeMenuItem = menuItems.find(item => matchesItem(item.path));
  const pageTitle = activeMenuItem?.text ?? "Dashboard";

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "sidebar.background",
        color: "sidebar.text",
      }}
    >
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
              color: "sidebar.textMuted",
              fontSize: "0.62rem",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              ml: "auto",
              display: { xs: "none", sm: "block" },
            }}
          >
            Supplier
          </Typography>
        </Link>
      </Toolbar>
      <Divider sx={{ mb: 1.5, borderColor: "sidebar.divider" }} />
      <List sx={{ px: 1.5, flex: 1, overflowY: "auto" }}>
        {menuItems.map(item => {
          const isActive = matchesItem(item.path);
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
                    bgcolor: isActive ? "sidebar.activeBg" : "transparent",
                    color: isActive ? "common.white" : "sidebar.text",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: isActive ? "sidebar.activeBg" : "sidebar.hoverBg",
                      color: "common.white",
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
      <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "sidebar.divider" }}>
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
              bgcolor: "sidebar.hoverBg",
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
                color: "common.white",
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
                color: "sidebar.textMuted",
                fontSize: "0.72rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
            >
              {user.email || user.roles[0] || "Supplier"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                void handleLogout();
              }}
              sx={{
                color: "sidebar.textMuted",
                "&:hover": { color: "error.main", bgcolor: "sidebar.hoverBg" },
              }}
            >
              <ExitIcon fontSize="small" />
            </IconButton>
            <KeyboardArrowDownIcon sx={{ color: "sidebar.textMuted", fontSize: 20 }} />
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

          <IconButton
            color="inherit"
            aria-label="toggle menu"
            onClick={handleDrawerToggle}
            sx={{ display: { xs: "none", md: "inline-flex" }, color: "text.secondary" }}
          >
            <MenuIcon />
          </IconButton>

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

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ThemeSwitcher />
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
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        id="supplier-menu-appbar"
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
              bgcolor: "sidebar.background",
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
              bgcolor: "sidebar.background",
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

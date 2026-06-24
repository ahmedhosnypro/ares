"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  InputBase,
  alpha,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
  ExitToApp as ExitIcon,
} from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { performLogoutCleanup } from "@/utils/auth-cleanup";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import NotificationsBell from "./NotificationsBell";
import LogoutConfirmDialog from "./LogoutConfirmDialog";

const APP_BAR_HEIGHT = 72;
const EXPANDED_DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 88;

export type DashboardMenuItem = {
  readonly text: string;
  readonly icon: React.ReactElement;
  readonly path: string;
};

type DashboardShellProps = {
  readonly children: React.ReactNode;
  readonly menuItems: DashboardMenuItem[];
  readonly sidebarLabel: string;
  readonly userFallbackName: string;
  readonly userFallbackInitial: string;
  readonly userRoleFallback: string;
  readonly notificationsHref: string;
  readonly notificationsLabel?: string;
};

function resolveActiveMenuItem(menuItems: DashboardMenuItem[], pathname: string): DashboardMenuItem | undefined {
  const matchesItem = (itemPath: string) => pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  return menuItems.filter(item => matchesItem(item.path)).sort((a, b) => b.path.length - a.path.length)[0];
}

export default function DashboardShell({
  children,
  menuItems,
  sidebarLabel,
  userFallbackName,
  userFallbackInitial,
  userRoleFallback,
  notificationsHref,
  notificationsLabel,
}: DashboardShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const router = useRouter();

  const isSidebarCollapsed = !isMobile && isCollapsed;
  const drawerWidth = isSidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH;

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
      return;
    }
    setIsCollapsed(prev => !prev);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    performLogoutCleanup();
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  const activeMenuItem = useMemo(() => resolveActiveMenuItem(menuItems, pathname), [menuItems, pathname]);
  const pageTitle = activeMenuItem?.text ?? "Dashboard";

  const callbackUrl = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      const destination = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      router.replace(destination);
    }
  }, [callbackUrl, router, status]);

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
  const userName = user.firstName ? `${user.firstName} ${user.lastName}` : userFallbackName;
  const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : userFallbackInitial;

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
      <List sx={{ px: isSidebarCollapsed ? 1 : 1.5, pt: 1.5, flex: 1, overflowY: "auto" }}>
        {menuItems.map(item => {
          const isActive = activeMenuItem?.path === item.path;
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
                    px: isSidebarCollapsed ? 1 : 1.5,
                    justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                    bgcolor: isActive ? "sidebar.activeBg" : "transparent",
                    color: isActive ? "common.white" : "sidebar.text",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: isActive ? "sidebar.activeBg" : "sidebar.hoverBg",
                      color: theme => (isActive || theme.palette.mode === "dark" ? "common.white" : "sidebar.text"),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: "inherit",
                      minWidth: isSidebarCollapsed ? "auto" : 36,
                      mr: isSidebarCollapsed ? 0 : 1,
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
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
                    sx={{ display: isSidebarCollapsed ? "none" : "block" }}
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
            justifyContent: isSidebarCollapsed ? "center" : "flex-start",
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
          <Box sx={{ flexGrow: 1, minWidth: 0, display: isSidebarCollapsed ? "none" : "block" }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "sidebar.text",
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
              {user.email || user.roles[0] || userRoleFallback}
            </Typography>
          </Box>
          <Box sx={{ display: isSidebarCollapsed ? "none" : "flex", alignItems: "center", gap: 1 }}>
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
          zIndex: theme => theme.zIndex.drawer + 1,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ height: APP_BAR_HEIGHT, gap: 2 }}>
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

          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Box sx={{ height: 28, width: 72, position: "relative" }}>
              <Image
                src="/img/favicon/logo_transparent.png"
                alt="Ares Logo"
                fill
                sizes="72px"
                style={{
                  objectFit: "contain",
                  filter: theme.palette.mode === "dark" ? "brightness(0) invert(1)" : "invert(1) brightness(0.5)",
                  mixBlendMode: theme.palette.mode === "dark" ? "screen" : "multiply",
                }}
              />
            </Box>
          </Link>

          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, minWidth: 0 }}>
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
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                fontSize: "0.75rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: { xs: "none", sm: "block" },
                bgcolor: "action.hover",
                px: 1,
                py: 0.25,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {sidebarLabel}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

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
            <InputBase
              placeholder="Search..."
              sx={{
                color: "text.primary",
                fontSize: "0.9rem",
                width: "100%",
                "& .MuiInputBase-input::placeholder": { color: "text.secondary", opacity: 1 },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ThemeSwitcher />
            <NotificationsBell allNotificationsHref={notificationsHref} allNotificationsLabel={notificationsLabel} />
            <IconButton
              onClick={() => {
                setLogoutDialogOpen(true);
              }}
              aria-label="logout"
              sx={{ color: "error.main", "&:hover": { bgcolor: theme => alpha(theme.palette.error.main, 0.08) } }}
            >
              <ExitIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

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
            handleClose();
            setLogoutDialogOpen(true);
          }}
          sx={{
            py: 1,
            borderRadius: 1.5,
            mx: 1,
            gap: 1.5,
            color: "error.main",
            "&:hover": { bgcolor: theme => alpha(theme.palette.error.main, 0.08) },
          }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: "auto" }}>
            <ExitIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: theme =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
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
              borderRight: "1px solid",
              borderColor: "sidebar.border",
              bgcolor: "sidebar.background",
            },
          }}
        >
          <Toolbar sx={{ height: APP_BAR_HEIGHT }} />
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
              borderColor: "sidebar.border",
              bgcolor: "sidebar.background",
              overflowX: "hidden",
              transition: theme =>
                theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
            },
          }}
          open
        >
          <Toolbar sx={{ height: APP_BAR_HEIGHT }} />
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          overflowX: "hidden",
          width: { md: `calc(100% - ${drawerWidth.toString()}px)` },
          // مسحنا الـ mt وحطينا pt خفيف عشان يدي مساحة تنفس من جوه بدل الفراغ البني
          pt: 1,
          pr: 10,
          pl: 10,
          transition: theme =>
            theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        {children}
      </Box>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={() => {
          void handleLogout();
        }}
      />
    </Box>
  );
}

"use client";

import React, { useState } from "react";
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem, 
  useTheme, useMediaQuery, CircularProgress, Badge
} from "@mui/material";
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, DirectionsCar as CarIcon,
  EventAvailable as BookingIcon, People as UsersIcon, Storefront as SupplierIcon,
  Settings as SettingsIcon, Notifications as NotificationsIcon,
  MonetizationOn as PricingIcon, Logout as LogoutIcon,
  Public as CountriesIcon, Place as LocationsIcon
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
  { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
];

export default function AdminNavigation({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // الدالة الجديدة لمعالجة تسجيل الخروج بشكل صحيح
  const handleLogout = async () => {
    // إيقاف التوجيه التلقائي لمسح حالة الجلسة تمامًا
    await signOut({ redirect: false }); 
    // إجبار المتصفح على إعادة التحميل والانتقال للصفحة الرئيسية لمسح الكاش
    window.location.href = "/"; 
  };

  if (status === "loading") {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  const userName = session?.user?.firstName ? `${session.user.firstName} ${session.user.lastName}` : "System Admin";
  const initial = session?.user?.firstName ? session.user.firstName.charAt(0).toUpperCase() : "A";

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ px: 3, display: 'flex', alignItems: 'center', gap: 2, height: 80 }}>
        <Box sx={{ width: 40, height: 40, bgcolor: 'primary.main', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Typography variant="h5" fontWeight="900" color="white">A</Typography>
        </Box>
        <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: '-0.5px', color: 'text.primary' }}>
          ARES Panel
        </Typography>
      </Toolbar>
      <Divider sx={{ mb: 2, mx: 2, opacity: 0.5 }} />
      <List sx={{ px: 2, flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <Link href={item.path} passHref style={{ width: '100%', textDecoration: 'none' }}>
                <ListItemButton 
                  onClick={() => isMobile && setMobileOpen(false)}
                  sx={{ 
                    borderRadius: 3,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.secondary',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }} />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {/* استخدام handleLogout هنا */}
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.dark' } }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <AppBar position="fixed" elevation={0} sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` }, bgcolor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>
        <Toolbar sx={{ height: 80 }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" fontWeight="800">{userName}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight="600">{session?.user?.roles?.[0] || "Administrator"}</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>{initial}</Avatar>
            </Box>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ elevation: 3, sx: { mt: 1.5, borderRadius: 3, minWidth: 200 } }}>
              <MenuItem onClick={() => setAnchorEl(null)}>Profile</MenuItem>
              {/* استخدام handleLogout هنا أيضاً */}
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, border: 'none' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, border: 'none' } }}>
          {drawer}
        </Drawer>
      </Box>

      {/* التعديل الأهم للـ Layout ليكون Responsive ولا يكسر الشاشات الصغيرة */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100vw',
          overflowX: 'hidden', // لمنع التمرير الأفقي للصفحة بأكملها
          mt: '80px', 
          p: { xs: 2, sm: 3, md: 4 } 
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
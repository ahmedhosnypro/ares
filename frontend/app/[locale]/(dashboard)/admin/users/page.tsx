"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/shared/i18n/routing";
import { Box, Tabs, Tab, CircularProgress, Paper, useTheme, useMediaQuery } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AirlineSeatReclineNormalIcon from "@mui/icons-material/AirlineSeatReclineNormal";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import UsersTab from "./UsersTab";
import AddIcon from "@mui/icons-material/Add";
import { Button, Stack, Typography } from "@mui/material";
import StatCard from "@/app/[locale]/(dashboard)/_components/StatCard";

type TabKey = "users" | "suppliers" | "drivers" | "inspectors";

const TAB_ORDER: TabKey[] = ["users", "suppliers", "drivers", "inspectors"];

const TAB_META: Record<TabKey, { label: string; icon: React.ReactElement }> = {
  users: { label: "Customers", icon: <PeopleIcon fontSize="small" /> },
  suppliers: { label: "Suppliers", icon: <StorefrontIcon fontSize="small" /> },
  drivers: { label: "Drivers", icon: <AirlineSeatReclineNormalIcon fontSize="small" /> },
  inspectors: { label: "Inspectors", icon: <ManageSearchIcon fontSize="small" /> },
};

function UsersHubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const rawTab = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = rawTab && TAB_ORDER.includes(rawTab) ? rawTab : "users";
  const activeIndex = TAB_ORDER.indexOf(activeTab);

  const handleChange = (_: React.SyntheticEvent, newIndex: number) => {
    const newTab = TAB_ORDER[newIndex];
    router.push(`/admin/users?tab=${newTab}`, { scroll: false });
  };

  const [counts, setCounts] = useState({
    totalUsers: 0,
    customers: 0,
    suppliers: 0,
    drivers: 0,
    inspectors: 0,
    blockedUsers: 0,
  });

  const totalUsers = counts.totalUsers;

  const statCards = [
    { title: "Total Users", value: totalUsers, icon: <PeopleIcon />, color: "primary" as const },
    { title: "Customers", value: counts.customers, icon: <PeopleIcon />, color: "success" as const },
    { title: "Suppliers", value: counts.suppliers, icon: <StorefrontIcon />, color: "warning" as const },
    { title: "Drivers", value: counts.drivers, icon: <AirlineSeatReclineNormalIcon />, color: "info" as const },
    { title: "Inspectors", value: counts.inspectors, icon: <ManageSearchIcon />, color: "primary" as const },
    { title: "Blocked Users", value: counts.blockedUsers, icon: <PeopleIcon />, color: "error" as const },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      {/* GLOBAL HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 3, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4 }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: "2rem", sm: "2.25rem" } }}>
            Users Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            Manage customers, suppliers, drivers and inspectors across the platform.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>
          <Button
            component={Link}
            href="/admin/users/create"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ flex: { xs: 1, sm: "none" }, borderRadius: 2, fontWeight: 700 }}
          >
            Add User
          </Button>
        </Stack>
      </Stack>

      {/* SUMMARY CARDS */}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 2, sm: 3 }, // المسافة بين الكروت
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)", // الموبايل: كارتين في كل صف
            sm: "repeat(3, 1fr)", // التابلت: 3 كروت في كل صف
            md: "repeat(3, 1fr)", // الشاشات الكبيرة: الـ 6 كروت جنب بعض
            lg: "repeat(6, 1fr)",
          },
          mb: 5,
        }}
      >
        {statCards.map((card, idx) => (
          <StatCard key={idx} title={card.title} value={card.value.toString()} icon={card.icon} color={card.color} />
        ))}
      </Box>
      {/* TAB BAR */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeIndex}
          onChange={handleChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            px: { xs: 0.5, sm: 2 },
            "& .MuiTab-root": {
              fontWeight: 600,
              minHeight: 52,
              textTransform: "none",
              fontSize: { xs: 13, sm: 14 },
            },
            "& .Mui-selected": {
              fontWeight: 800,
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          {TAB_ORDER.map(key => (
            <Tab
              key={key}
              id={`user-hub-tab-${key}`}
              aria-controls={`user-hub-panel-${key}`}
              label={`${TAB_META[key].label} ${counts[key === "users" ? "customers" : key] > 0 ? `(${counts[key === "users" ? "customers" : key]})` : ""}`}
              icon={TAB_META[key].icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* TAB PANEL */}
      <Box role="tabpanel">
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          }
        >
          <UsersTab activeTab={activeTab} onStatsUpdated={setCounts} />
        </Suspense>
      </Box>
    </Box>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function UsersHubPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 20 }}>
          <CircularProgress />
        </Box>
      }
    >
      <UsersHubInner />
    </Suspense>
  );
}

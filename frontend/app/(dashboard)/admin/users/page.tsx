"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Tabs, Tab, CircularProgress, Paper, useTheme, useMediaQuery } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AirlineSeatReclineNormalIcon from "@mui/icons-material/AirlineSeatReclineNormal";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";

import UsersTab from "./UsersTab";
import SuppliersTab from "./SuppliersTab";
import DriversTab from "./DriversTab";
import InspectorsTab from "./InspectorsTab";

type TabKey = "users" | "suppliers" | "drivers" | "inspectors";

const TAB_ORDER: TabKey[] = ["users", "suppliers", "drivers", "inspectors"];

const TAB_META: Record<TabKey, { label: string; icon: React.ReactElement }> = {
  users: { label: "Users", icon: <PeopleIcon fontSize="small" /> },
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

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* TAB BAR */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
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
              label={TAB_META[key].label}
              icon={TAB_META[key].icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* TAB PANELS */}
      {TAB_ORDER.map(key => (
        <Box
          key={key}
          role="tabpanel"
          id={`user-hub-panel-${key}`}
          aria-labelledby={`user-hub-tab-${key}`}
          hidden={activeTab !== key}
        >
          {activeTab === key && (
            <Suspense
              fallback={
                <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                  <CircularProgress />
                </Box>
              }
            >
              {key === "users" && <UsersTab />}
              {key === "suppliers" && <SuppliersTab />}
              {key === "drivers" && <DriversTab />}
              {key === "inspectors" && <InspectorsTab />}
            </Suspense>
          )}
        </Box>
      ))}
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

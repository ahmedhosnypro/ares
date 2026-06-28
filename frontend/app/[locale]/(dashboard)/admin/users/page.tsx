"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "@/shared/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Paper,
  useTheme,
  useMediaQuery,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AirlineSeatReclineNormalIcon from "@mui/icons-material/AirlineSeatReclineNormal";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import AddIcon from "@mui/icons-material/Add";
import UsersTab from "./UsersTab";
import SuppliersTab from "./SuppliersTab";
import DriversTab from "./DriversTab";
import InspectorsTab from "./InspectorsTab";
import { Link } from "@/shared/i18n/routing";
import { StatCard } from "@/app/[locale]/(dashboard)/_components/VehicleStats";
import { getUsers, type UserStats } from "@/api-clients/users/users";
import { logger } from "@/utils/logger";

type TabKey = "users" | "suppliers" | "drivers" | "inspectors";

const TAB_ORDER: TabKey[] = ["users", "suppliers", "drivers", "inspectors"];

const TAB_META: Record<TabKey, { icon: React.ReactElement }> = {
  users: { icon: <PeopleIcon fontSize="small" /> },
  suppliers: { icon: <StorefrontIcon fontSize="small" /> },
  drivers: { icon: <AirlineSeatReclineNormalIcon fontSize="small" /> },
  inspectors: { icon: <ManageSearchIcon fontSize="small" /> },
};

function UsersHubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const t = useTranslations("dashboardAdmin.users");

  const rawTab = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = rawTab && TAB_ORDER.includes(rawTab) ? rawTab : "users";
  const activeIndex = TAB_ORDER.indexOf(activeTab);

  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    customers: 0,
    suppliers: 0,
    drivers: 0,
    inspectors: 0,
    blockedUsers: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getUsers(1, 1);
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        logger.error("Failed to fetch user stats", err);
      }
    }
    void fetchStats();
  }, []);

  const handleChange = (_: React.SyntheticEvent, newIndex: number) => {
    const newTab = TAB_ORDER[newIndex];
    router.push(`/admin/users?tab=${newTab}`, { scroll: false });
  };

  const statCards = [
    { title: t("stats.totalUsers"), value: stats.totalUsers, icon: <PeopleIcon />, color: "primary" },
    { title: t("stats.customers"), value: stats.customers, icon: <PeopleIcon />, color: "info" },
    { title: t("stats.suppliers"), value: stats.suppliers, icon: <StorefrontIcon />, color: "warning" },
    { title: t("stats.drivers"), value: stats.drivers, icon: <AirlineSeatReclineNormalIcon />, color: "success" },
    { title: t("stats.inspectors"), value: stats.inspectors, icon: <ManageSearchIcon />, color: "secondary" },
    { title: t("stats.blocked"), value: stats.blockedUsers, icon: <PeopleIcon />, color: "error" },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 3, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4 }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: "2rem", sm: "2.25rem" } }}>
            {t("page.title")}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            {t("page.subtitle")}
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
            {t("page.addUser")}
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          overflowX: "auto",
          gap: 3,
          mb: 5,
          pb: 1,
          "& > *": {
            flexShrink: 0,
            flexBasis: { xs: "280px", sm: "240px", md: "calc((100% - 5 * 24px) / 6)" },
            minWidth: { xs: "280px", sm: "240px", md: "auto" },
          },
        }}
      >
        {statCards.map((card, idx) => (
          <StatCard key={idx} label={card.title} value={card.value} color={card.color} icon={card.icon} />
        ))}
      </Box>

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
              label={t(`tabs.${key}`)}
              icon={TAB_META[key].icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Box role="tabpanel">
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          }
        >
          {activeTab === "users" && <UsersTab />}
          {activeTab === "suppliers" && <SuppliersTab />}
          {activeTab === "drivers" && <DriversTab />}
          {activeTab === "inspectors" && <InspectorsTab />}
        </Suspense>
      </Box>
    </Box>
  );
}

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

"use client";

import { Box, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/PersonOutlined";
import StorefrontIcon from "@mui/icons-material/StorefrontOutlined";
import ShieldIcon from "@mui/icons-material/ShieldOutlined";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { type UserStats } from "@/api-clients/users/users";
import CompactStatCard from "./CompactStatCard";
import SteeringWheelIcon from "./SteeringWheelIcon";

interface UserStatsGridProps {
  readonly stats: UserStats | null;
}

export default function UserStatsGrid({ stats }: UserStatsGridProps) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.users");

  const adminsCount = stats
    ? stats.totalUsers - stats.customers - stats.suppliers - stats.drivers - stats.inspectors
    : 0;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(4, 1fr)",
          lg: "repeat(8, 1fr)",
        },
        gap: { xs: 1.5, sm: 2, lg: 1 },
        mb: 4,
      }}
    >
      <CompactStatCard
        label={t("stats.totalUsers")}
        value={stats?.totalUsers ?? 0}
        color={theme.palette.status.confirmed.main}
        icon={<PeopleIcon />}
        trendText="12.5%"
        isUp={true}
      />
      <CompactStatCard
        label={t("stats.admins")}
        value={adminsCount}
        color={theme.palette.primary.main}
        icon={<AdminPanelSettingsIcon />}
        trendText="3.5%"
        isUp={true}
      />
      <CompactStatCard
        label={t("stats.customers")}
        value={stats?.customers ?? 0}
        color={theme.palette.status.active.main}
        icon={<PersonIcon />}
        trendText="10.3%"
        isUp={true}
      />
      <CompactStatCard
        label={t("stats.suppliers")}
        value={stats?.suppliers ?? 0}
        color={theme.palette.status.completed.main}
        icon={<StorefrontIcon />}
        trendText="8.1%"
        isUp={true}
      />
      <CompactStatCard
        label={t("stats.drivers")}
        value={stats?.drivers ?? 0}
        color={theme.palette.status.pending.main}
        icon={<SteeringWheelIcon />}
        trendText="14.7%"
        isUp={true}
      />
      <CompactStatCard
        label={t("stats.inspectors")}
        value={stats?.inspectors ?? 0}
        color={theme.palette.status.blocked.main}
        icon={<ShieldIcon />}
        trendText="6.2%"
        isUp={true}
      />
      <CompactStatCard
        label={t("stats.active")}
        value={stats ? stats.totalUsers - stats.blockedUsers : 0}
        color={theme.palette.status.active.main}
        icon={<CheckCircleIcon />}
        trendText="9.4%"
        isUp={true}
      />
      <CompactStatCard
        label={t("stats.blocked")}
        value={stats?.blockedUsers ?? 0}
        color={theme.palette.status.blocked.main}
        icon={<BlockIcon />}
        trendText="1.2%"
        isUp={false}
      />
    </Box>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Typography, useTheme } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CarRepairIcon from "@mui/icons-material/CarRepair";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import {
  getInspectorTodayStats,
  getInspectorTasks,
  type InspectorTodayStats,
  type InspectorTask,
} from "@/api-clients/inspections/inspections";
import { logger } from "@/utils/logger";
import VehicleStats from "@/app/[locale]/(dashboard)/_components/VehicleStats";
import TodayTasksList from "./_components/TodayTasksList";

export default function InspectorDashboardPage() {
  const theme = useTheme();
  const t = useTranslations("dashboard.inspectorInspections");
  const [tasks, setTasks] = useState<InspectorTask[]>([]);
  const [stats, setStats] = useState<InspectorTodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksData, statsData] = await Promise.all([getInspectorTasks(), getInspectorTodayStats()]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      logger.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const dashboardStats = [
    {
      label: t("stats.checkOuts"),
      value: stats?.checkOutsCount ?? 0,
      color: "success",
      icon: <DirectionsCarIcon fontSize="small" />,
      subtitle: t("stats.checkOutsSubtitle"),
    },
    {
      label: t("stats.checkIns"),
      value: stats?.checkInsCount ?? 0,
      color: "error",
      icon: <CarRepairIcon fontSize="small" />,
      subtitle: t("stats.checkInsSubtitle"),
    },
    {
      label: t("stats.overdueTasks"),
      value: stats?.overdueCount ?? 0,
      color: "warning",
      icon: <WarningAmberIcon fontSize="small" />,
      subtitle: t("stats.overdueTasksSubtitle"),
    },
    {
      label: t("stats.completedToday"),
      value: stats?.completedTodayCount ?? 0,
      color: "info",
      icon: <CheckCircleOutlinedIcon fontSize="small" />,
      subtitle: t("stats.completedTodaySubtitle"),
    },
  ];

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {t("page.title")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }} variant="body2">
          {t("page.subtitle")}
        </Typography>
      </Box>

      {/* KPI stats */}
      <VehicleStats items={dashboardStats} loading={loading} />

      {/* Today's Tasks — 1-column full-width */}
      <Box
        sx={{
          mt: 3,
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: theme.palette.shadow.card,
        }}
      >
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {t("page.todayTasksTitle")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("page.todayTasksSubtitle")}
          </Typography>
        </Box>

        <TodayTasksList tasks={tasks} loading={loading} />
      </Box>
    </Box>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Typography, Paper, Stack, Button, Skeleton, useTheme, alpha } from "@mui/material";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CarRepairIcon from "@mui/icons-material/CarRepair";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import HistoryIcon from "@mui/icons-material/History";
import {
  listMyInspections,
  getInspectorTodayStats,
  type InspectionSummary,
  type InspectorTodayStats,
} from "@/api-clients/inspections/inspections";
import { logger } from "@/utils/logger";
import InspectionStatusBadge from "./_components/InspectionStatusBadge";
import VehicleStats from "@/app/(dashboard)/_components/VehicleStats";

export default function InspectorDashboardPage() {
  const [items, setItems] = useState<InspectionSummary[]>([]);
  const [stats, setStats] = useState<InspectorTodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignedData, statsData] = await Promise.all([listMyInspections(false), getInspectorTodayStats()]);
      setItems(assignedData);
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
      label: "Check-Outs",
      value: stats?.checkOutsCount ?? 0,
      color: "success",
      icon: <DirectionsCarIcon fontSize="small" />,
      subtitle: "Deliveries today",
    },
    {
      label: "Check-Ins",
      value: stats?.checkInsCount ?? 0,
      color: "error",
      icon: <CarRepairIcon fontSize="small" />,
      subtitle: "Returns today",
    },
    {
      label: "Overdue Tasks",
      value: stats?.overdueCount ?? 0,
      color: "warning",
      icon: <WarningAmberIcon fontSize="small" />,
      subtitle: "Past due",
    },
    {
      label: "Completed Today",
      value: stats?.completedTodayCount ?? 0,
      color: "info",
      icon: <CheckCircleOutlinedIcon fontSize="small" />,
      subtitle: "Done today",
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Inspector Dashboard
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Overview of your assignments and today&apos;s metrics.
        </Typography>
      </Box>

      {/* KPI STATS */}
      <VehicleStats items={dashboardStats} loading={loading} />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}
          >
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Recent &amp; Upcoming Assignments
              </Typography>
              <Button component={Link} href="/inspector/inspections" size="small" endIcon={<ArrowForwardIcon />}>
                View all
              </Button>
            </Stack>

            {(() => {
              if (loading) {
                return (
                  <Stack spacing={1.5}>
                    {[1, 2, 3, 4].map(n => (
                      <Skeleton key={n} variant="rectangular" height={84} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                );
              }
              if (items.length === 0) {
                return (
                  <Box sx={{ textAlign: "center", py: 8, opacity: 0.7 }}>
                    <AssignmentIcon sx={{ fontSize: 60, mb: 2, color: "text.disabled" }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      All caught up!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You have no pending inspections right now.
                    </Typography>
                  </Box>
                );
              }
              return (
                <Stack spacing={1.5}>
                  {items.slice(0, 5).map(i => (
                    <InspectionListItem key={i.inspectionId} item={i} />
                  ))}
                </Stack>
              );
            })()}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
              bgcolor: "background.default",
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Quick Actions
              </Typography>
            </Stack>
            <Stack spacing={2}>
              <Button
                component={Link}
                href="/inspector/inspections"
                variant="contained"
                fullWidth
                size="large"
                startIcon={<PendingActionsIcon />}
                sx={{ py: 1.5, justifyContent: "flex-start", px: 3, borderRadius: 2 }}
              >
                Start Pending Inspection
              </Button>
              <Button
                component={Link}
                href="/inspector/history"
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<HistoryIcon />}
                sx={{ py: 1.5, justifyContent: "flex-start", px: 3, borderRadius: 2, bgcolor: "background.paper" }}
              >
                View History
              </Button>
              <Button
                component={Link}
                href="/inspector/profile"
                variant="outlined"
                fullWidth
                size="large"
                sx={{ py: 1.5, justifyContent: "flex-start", px: 3, borderRadius: 2, bgcolor: "background.paper" }}
              >
                My Profile
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function InspectionListItem({ item }: { readonly item: InspectionSummary }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.02) },
        transition: "all 0.2s",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {item.bookingNumber || `Booking ${item.bookingId.split("-")[0]}`}
            </Typography>
            <InspectionStatusBadge status={item.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 600 }}>
            {item.vehicleDisplayName}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Scheduled: {new Date(item.inspectionDate).toLocaleString()}
          </Typography>
        </Box>
        <Button
          component={Link}
          href={`/inspector/inspections/${item.inspectionId}`}
          variant="contained"
          size="small"
          startIcon={<AssignmentTurnedInIcon />}
          sx={{ borderRadius: 2, px: 2, py: 0.8 }}
        >
          Open
        </Button>
      </Stack>
    </Paper>
  );
}

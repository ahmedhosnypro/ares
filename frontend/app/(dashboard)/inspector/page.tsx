"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Card,
  Skeleton,
  useTheme,
  alpha,
  type Theme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  listMyInspections,
  type InspectionSummary,
} from "@/api-clients/inspections/inspections";
import { logger } from "@/utils/logger";
import InspectionStatusBadge from "./_components/InspectionStatusBadge";

function StatCard({ label, value, color }: { readonly label: string; readonly value: number; readonly color: string }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        background: (theme: Theme) =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(color, 0.08)} 100%)`,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color }}>
        {value}
      </Typography>
    </Card>
  );
}

export default function InspectorDashboardPage() {
  const theme = useTheme();
  const [items, setItems] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listMyInspections(false);
      setItems(data);
    } catch (err) {
      logger.error("Failed to load assigned inspections", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = useMemo(
    () => ({
      pending: items.filter(i => i.status === "Pending").length,
      total: items.length,
    }),
    [items]
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Inspector Dashboard
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Your assigned inspection tasks at a glance.
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="Pending Inspections" value={stats.pending} color={theme.palette.warning.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="All Assigned" value={stats.total} color={theme.palette.primary.main} />
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Latest Assigned Inspections
          </Typography>
          <Button
            component={Link}
            href="/inspector/inspections"
            size="small"
            endIcon={<ArrowForwardIcon />}
          >
            View all
          </Button>
        </Stack>

        {(() => {
          if (loading) {
            return (
              <Stack spacing={1.5}>
                {[1, 2, 3].map(n => (
                  <Skeleton key={n} variant="rectangular" height={84} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            );
          }
          if (items.length === 0) {
            return (
              <Box sx={{ textAlign: "center", py: 6, opacity: 0.7 }}>
                <AssignmentIcon sx={{ fontSize: 60, mb: 1, color: "text.disabled" }} />
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
    </Box>
  );
}

function InspectionListItem({ item }: { readonly item: InspectionSummary }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main" },
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
          <Typography variant="body2" color="text.secondary" noWrap>
            {item.vehicleDisplayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Assigned {new Date(item.inspectionDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Button
          component={Link}
          href={`/inspector/inspections/${item.inspectionId}`}
          variant="contained"
          size="small"
          startIcon={<AssignmentTurnedInIcon />}
          sx={{ borderRadius: 2 }}
        >
          Open Inspection
        </Button>
      </Stack>
    </Paper>
  );
}

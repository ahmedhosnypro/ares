"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  useTheme,
  alpha,
  type Theme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  getInspectorDetails,
  updateInspectorStatus,
  type InspectorDetails,
} from "@/api-clients/inspectors/inspectors";
import { logger } from "@/utils/logger";

interface Props {
  readonly inspectorId: string;
}

function StatCard({ label, value, color }: { readonly label: string; readonly value: number; readonly color: string }) {
  return (
    <Paper
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
    </Paper>
  );
}

function statusChipProps(status: string, theme: Theme) {
  const map: Record<string, { bg: string; color: string }> = {
    Pending: { bg: alpha(theme.palette.warning.main, 0.15), color: theme.palette.warning.main },
    Approved: { bg: alpha(theme.palette.success.main, 0.15), color: theme.palette.success.main },
    Rejected: { bg: alpha(theme.palette.error.main, 0.15), color: theme.palette.error.main },
  };
  return map[status] ?? { bg: alpha(theme.palette.grey[500], 0.15), color: theme.palette.text.primary };
}

export default function InspectorDetailsClient({ inspectorId }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const [details, setDetails] = useState<InspectorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInspectorDetails(inspectorId);
      setDetails(data);
    } catch (err) {
      logger.error("Failed to load inspector details", err);
      setError("Failed to load inspector details.");
    } finally {
      setLoading(false);
    }
  }, [inspectorId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleToggle = () => {
    if (!details) return;
    void (async () => {
      setToggling(true);
      try {
        await updateInspectorStatus(details.inspector.inspectorId, {
          isActive: !details.inspector.isActive,
          isAvailable: !details.inspector.isActive ? true : null,
        });
        await fetchData();
      } catch (err) {
        logger.error("Toggle failed", err);
      } finally {
        setToggling(false);
      }
    })();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !details) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Alert severity="error">{error || "Inspector not found"}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          onClick={() => {
            router.push("/admin/inspectors");
          }}
        >
          Back to Inspectors
        </Button>
      </Box>
    );
  }

  const i = details.inspector;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          router.push("/admin/inspectors");
        }}
        sx={{ mb: 2 }}
      >
        Back to Inspectors
      </Button>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: 24,
                bgcolor: theme.palette.primary.light,
                fontWeight: 700,
              }}
            >
              {i.firstName[0]}
              {i.lastName[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {i.firstName} {i.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {i.email}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={`Code: ${i.employeeCode}`} size="small" />
                <Chip
                  label={i.isActive ? "Active" : "Disabled"}
                  size="small"
                  sx={{
                    bgcolor: i.isActive
                      ? alpha(theme.palette.success.main, 0.15)
                      : alpha(theme.palette.error.main, 0.15),
                    color: i.isActive ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={i.isAvailable ? "Available" : "Unavailable"}
                  size="small"
                  sx={{
                    bgcolor: i.isAvailable
                      ? alpha(theme.palette.info.main, 0.15)
                      : alpha(theme.palette.warning.main, 0.15),
                    color: i.isAvailable ? theme.palette.info.main : theme.palette.warning.main,
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Box>
          </Stack>

          <Button
            variant="contained"
            color={i.isActive ? "error" : "success"}
            startIcon={i.isActive ? <BlockIcon /> : <CheckCircleIcon />}
            disabled={toggling}
            onClick={handleToggle}
          >
            {i.isActive ? "Disable Inspector" : "Enable Inspector"}
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Total Assigned" value={details.assignedCount} color={theme.palette.primary.main} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Pending" value={details.pendingCount} color={theme.palette.warning.main} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Approved" value={details.approvedCount} color={theme.palette.success.main} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Rejected" value={details.rejectedCount} color={theme.palette.error.main} />
          </Grid>
        </Grid>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Recent Inspections
        </Typography>
        {details.recentInspections.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No inspections recorded yet.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Booking</TableCell>
                <TableCell>Inspection Date</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.recentInspections.map(r => {
                const chip = statusChipProps(r.status, theme);
                return (
                  <TableRow key={r.inspectionId}>
                    <TableCell>{r.bookingNumber || r.bookingId.split("-")[0]}</TableCell>
                    <TableCell>{new Date(r.inspectionDate).toLocaleString()}</TableCell>
                    <TableCell>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={r.status}
                        size="small"
                        sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700 }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Select,
  MenuItem,
  FormControl,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Snackbar,
  Alert,
  Card,
  useTheme,
  useMediaQuery,
  alpha,
  type Theme,
  type SelectChangeEvent,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import {
  listInspectors,
  updateInspectorStatus,
  type Inspector,
} from "@/api-clients/inspectors/inspectors";
import { logger } from "@/utils/logger";
import AddInspectorDialog from "./_components/AddInspectorDialog";

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

export default function InspectorsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false,
    severity: "success",
    message: "",
  });

  const fetchInspectors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listInspectors();
      setInspectors(data);
    } catch (err) {
      logger.error("Failed to load inspectors", err);
      setToast({ open: true, severity: "error", message: "Failed to load inspectors" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInspectors();
  }, [fetchInspectors]);

  const filtered = useMemo(() => {
    return inspectors.filter(i => {
      const haystack = `${i.firstName} ${i.lastName} ${i.email} ${i.employeeCode}`.toLowerCase();
      const matchSearch = haystack.includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && i.isActive) ||
        (statusFilter === "inactive" && !i.isActive);
      return matchSearch && matchStatus;
    });
  }, [inspectors, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: inspectors.length,
      active: inspectors.filter(i => i.isActive).length,
      inactive: inspectors.filter(i => !i.isActive).length,
    };
  }, [inspectors]);

  const handleToggleActive = (inspector: Inspector) => {
    void (async () => {
      try {
        await updateInspectorStatus(inspector.inspectorId, {
          isActive: !inspector.isActive,
          isAvailable: !inspector.isActive ? true : null,
        });
        setToast({
          open: true,
          severity: "success",
          message: `Inspector ${!inspector.isActive ? "enabled" : "disabled"} successfully`,
        });
        await fetchInspectors();
      } catch (err) {
        logger.error("Toggle inspector failed", err);
        setToast({ open: true, severity: "error", message: "Failed to update inspector status" });
      }
    })();
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}>
            Inspectors Management
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Provision and manage the pool of vehicle inspectors.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setAddOpen(true);
          }}
          sx={{
            px: 2.5,
            py: 1.2,
            borderRadius: 2,
            fontWeight: 700,
            background: (theme: Theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: 3,
            "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Add Inspector
        </Button>
      </Stack>

      {/* STATS */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Total Inspectors" value={stats.total} color={theme.palette.primary.main} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard label="Active" value={stats.active} color={theme.palette.success.main} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard label="Disabled" value={stats.inactive} color={theme.palette.error.main} />
        </Grid>
      </Grid>

      {/* FILTERS */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email or employee code..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
          }}
          size={isMobile ? "small" : "medium"}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl sx={{ minWidth: { xs: "100%", sm: 160 } }} size={isMobile ? "small" : "medium"}>
          <Select
            value={statusFilter}
            onChange={(e: SelectChangeEvent) => {
              setStatusFilter(e.target.value);
            }}
            displayEmpty
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Disabled</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* LIST */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        // Mobile cards
        <Stack spacing={1.5}>
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map(i => <InspectorMobileCard key={i.inspectorId} inspector={i} onToggle={handleToggleActive} />)
          )}
        </Stack>
      ) : (
        <Paper sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Inspector</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Employee Code</TableCell>
                <TableCell>Availability</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(i => (
                  <TableRow key={i.inspectorId} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.light, fontWeight: 700 }}>
                          {i.firstName[0] || "?"}
                          {i.lastName[0] || ""}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>
                            {i.firstName} {i.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(i.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{i.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {i.phoneNumber || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={i.employeeCode} size="small" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title="View Details">
                          <IconButton
                            component={Link}
                            href={`/admin/inspectors/${i.inspectorId}`}
                            size="small"
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={i.isActive ? "Disable" : "Enable"}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              handleToggleActive(i);
                            }}
                            sx={{ color: i.isActive ? "error.main" : "success.main" }}
                          >
                            {i.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <AddInspectorDialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
        }}
        onCreated={() => {
          setToast({ open: true, severity: "success", message: "Inspector created successfully" });
          void fetchInspectors();
        }}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => {
          setToast(t => ({ ...t, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box sx={{ textAlign: "center", opacity: 0.6, py: 4 }}>
      <SearchIcon sx={{ fontSize: 60, mb: 2, color: "text.disabled" }} />
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
        No inspectors found
      </Typography>
      <Typography variant="body2" color="text.disabled">
        Try changing your filters or add a new inspector.
      </Typography>
    </Box>
  );
}

function InspectorMobileCard({
  inspector,
  onToggle,
}: {
  readonly inspector: Inspector;
  readonly onToggle: (i: Inspector) => void;
}) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.light, fontWeight: 700, width: 40, height: 40 }}>
            {inspector.firstName[0]}
            {inspector.lastName[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
              {inspector.firstName} {inspector.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {inspector.email}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={inspector.isActive ? "Active" : "Disabled"}
          size="small"
          sx={{
            bgcolor: inspector.isActive
              ? alpha(theme.palette.success.main, 0.15)
              : alpha(theme.palette.error.main, 0.15),
            color: inspector.isActive ? theme.palette.success.main : theme.palette.error.main,
            fontWeight: 700,
          }}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        Code: <strong>{inspector.employeeCode}</strong>
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Phone: <strong>{inspector.phoneNumber || "—"}</strong>
      </Typography>
      <Stack direction="row" spacing={1}>
        <IconButton component={Link} href={`/admin/inspectors/${inspector.inspectorId}`} size="small">
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => {
            onToggle(inspector);
          }}
          sx={{ color: inspector.isActive ? "error.main" : "success.main" }}
        >
          {inspector.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
        </IconButton>
      </Stack>
    </Paper>
  );
}

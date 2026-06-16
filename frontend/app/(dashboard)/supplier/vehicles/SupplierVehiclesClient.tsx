"use client";

/**
 * Supplier Vehicles list page (`/supplier/vehicles`).
 *
 * Mirrors the visual language of the existing admin vehicles table
 * (`app/admin/vehicles/page.tsx`) — same MUI table, chips, pagination,
 * delete dialog and snackbar — but talks to the supplier-scoped endpoints
 * and adds a quick availability toggle in the row.
 *
 * All search / filter / pagination are backend-driven via
 * `GET /api/supplier/vehicles`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  EditRounded as EditIcon,
  SearchRounded as SearchIcon,
  LaunchOutlined as ViewIcon,
} from "@mui/icons-material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  deleteSupplierVehicle,
  getSupplierVehicles,
  isApprovedStatus,
  setSupplierVehicleAvailability,
  type PagedResult,
  type SupplierVehicleListItem,
} from "@/api-clients/supplier-vehicles/supplier-vehicles";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import { AvailabilityChip, StatusChip } from "./_components/StatusChips";

// ── Filter dropdown options — kept in sync with the backend status strings ────
const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

const AVAILABILITY_OPTIONS = [
  { label: "All availability", value: "" },
  { label: "Available", value: "Available" },
  { label: "Unavailable", value: "Unavailable" },
];

const PAGE_SIZE = 10;

// Lightweight debounce so search keystrokes don't spam the backend.
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => {
      window.clearTimeout(t);
    };
  }, [value, delay]);
  return debounced;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
}

export default function SupplierVehiclesClient() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isRestricted = session?.user?.status.toLowerCase() === "restricted";

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounced(searchInput);
  const [statusFilter, setStatusFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [page, setPage] = useState(1);

  // ── Fetch state ───────────────────────────────────────────────────────────
  const [data, setData] = useState<PagedResult<SupplierVehicleListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<SupplierVehicleListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = useCallback((message: string, severity: SnackbarState["severity"] = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Reset page when filters change so the user always lands on page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, availabilityFilter]);

  const fetchVehicles = useCallback(async () => {
    if (sessionStatus === "loading") return;
    const accessToken = session?.accessToken;
    if (!accessToken) {
      setLoading(false);
      setError("You must be signed in to view your vehicles.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getSupplierVehicles(accessToken, {
        search: debouncedSearch,
        status: statusFilter,
        availabilityStatus: availabilityFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(result);
    } catch (err) {
      logger.error("Failed to load supplier vehicles", err);
      setError("Could not load your vehicles. Please try again shortly.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, sessionStatus, debouncedSearch, statusFilter, availabilityFilter, page]);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !session?.accessToken) return;
    setDeleting(true);
    try {
      await deleteSupplierVehicle(session.accessToken, deleteTarget.vehicleId);
      // Optimistic local removal so the row disappears immediately even
      // before the refetch lands.
      setData(prev =>
        prev
          ? {
              ...prev,
              data: prev.data.filter(v => v.vehicleId !== deleteTarget.vehicleId),
              totalCount: Math.max(0, prev.totalCount - 1),
            }
          : prev
      );
      showToast("Vehicle deleted successfully.", "success");
      setDeleteTarget(null);
      // Refresh so totals/pages re-align with backend truth.
      void fetchVehicles();
    } catch (err) {
      logger.error("Failed to delete supplier vehicle", err);
      const msg = err instanceof Error ? err.message : "Failed to delete vehicle.";
      showToast(msg, "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, session?.accessToken, fetchVehicles, showToast]);

  const handleAvailabilityToggle = useCallback(
    async (row: SupplierVehicleListItem) => {
      if (!session?.accessToken || isRestricted) return;

      // Block client-side: only approved vehicles can become available.
      const currentlyAvailable = row.availabilityStatus.toLowerCase() === "available";
      const next = !currentlyAvailable;
      if (next && !isApprovedStatus(row.status)) {
        showToast("Only approved vehicles can be made available.", "info");
        return;
      }

      setTogglingId(row.vehicleId);
      // Optimistic update
      setData(prev =>
        prev
          ? {
              ...prev,
              data: prev.data.map(v =>
                v.vehicleId === row.vehicleId ? { ...v, availabilityStatus: next ? "Available" : "Unavailable" } : v
              ),
            }
          : prev
      );

      try {
        await setSupplierVehicleAvailability(session.accessToken, row.vehicleId, next);
        showToast(next ? "Vehicle is now available." : "Vehicle is now unavailable.", "success");
      } catch (err) {
        logger.error("Failed to toggle availability", err);
        showToast("Failed to update availability.", "error");
        // Roll back on failure.
        setData(prev =>
          prev
            ? {
                ...prev,
                data: prev.data.map(v =>
                  v.vehicleId === row.vehicleId
                    ? { ...v, availabilityStatus: currentlyAvailable ? "Available" : "Unavailable" }
                    : v
                ),
              }
            : prev
        );
      } finally {
        setTogglingId(null);
      }
    },
    [session?.accessToken, showToast, isRestricted]
  );

  // ── Derived helpers ───────────────────────────────────────────────────────
  const rows = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const filtersActive = useMemo(
    () => Boolean(debouncedSearch || statusFilter || availabilityFilter),
    [debouncedSearch, statusFilter, availabilityFilter]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          gap: 2,
          justifyContent: "space-between",
          mb: 4,
          alignItems: { xs: "flex-start", sm: "center" },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "1.6rem", md: "2rem" } }}>
            My Vehicles
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Manage your fleet — add, edit, delete, and toggle availability.
          </Typography>
        </Box>

        {!isRestricted && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              handleNavigate("/supplier/vehicles/create");
            }}
            sx={{
              px: 2.5,
              py: 1.2,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              background: t => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
              boxShadow: 3,
              whiteSpace: "nowrap",
              alignSelf: { xs: "stretch", sm: "auto" },
              "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
            }}
          >
            Add New Vehicle
          </Button>
        )}
      </Stack>

      {/* FILTERS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search make, model, or license plate…"
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 3 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 3 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Availability"
            value={availabilityFilter}
            onChange={e => {
              setAvailabilityFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {AVAILABILITY_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* INLINE ERROR BANNER */}
      {error && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* CONTENT */}
      {(() => {
        if (loading) {
          return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          );
        }

        if (rows.length === 0) {
          return (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                py: 8,
                textAlign: "center",
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor: t => alpha(t.palette.text.disabled, 0.1),
                }}
              >
                <CarIcon sx={{ fontSize: 32, color: "text.disabled" }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
                {filtersActive ? "No vehicles match these filters" : "You don't have any vehicles yet"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {filtersActive
                  ? "Try clearing filters or adjusting your search."
                  : 'Click "Add New Vehicle" to list your first one.'}
              </Typography>
            </Paper>
          );
        }

        return (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: isMobile ? 600 : 880 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: t => alpha(t.palette.primary.main, 0.04),
                      "& .MuiTableCell-head": {
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "text.secondary",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell sx={{ pl: 3 }}>Vehicle</TableCell>
                    <TableCell>Price / day</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Availability</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Bookings</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Created</TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map(v => (
                    <VehicleTableRow
                      key={v.vehicleId}
                      vehicle={v}
                      togglingId={togglingId}
                      isRestricted={isRestricted}
                      onNavigate={handleNavigate}
                      onDelete={setDeleteTarget}
                      onToggleAvailability={handleAvailabilityToggle}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="caption" color="text.secondary">
                        Showing <strong>{rows.length}</strong> of {totalCount} vehicles
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={3} align="right">
                      {totalPages > 1 && (
                        <Pagination
                          count={totalPages}
                          page={page}
                          onChange={(_, value) => {
                            setPage(value);
                          }}
                          size="small"
                          siblingCount={isMobile ? 0 : 1}
                          sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Paper>
        );
      })()}

      {/* DELETE DIALOG */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1, mx: { xs: 2, sm: "auto" } } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete vehicle?</DialogTitle>
        <DialogContent>
          {deleteTarget && (
            <>
              You&apos;re about to remove{" "}
              <strong>
                {deleteTarget.make} {deleteTarget.model}
              </strong>{" "}
              from your fleet. This will hide it from your dashboard. Existing bookings, payments, and history are
              preserved.
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, pb: 2, px: 2 }}>
          <Button
            onClick={() => {
              setDeleteTarget(null);
            }}
            variant="outlined"
            disabled={deleting}
            sx={{ borderRadius: 2, flex: { xs: 1, sm: "none" } }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleDelete();
            }}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ borderRadius: 2, fontWeight: 700, flex: { xs: 1, sm: "none" } }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbar(s => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ maxWidth: { xs: "calc(100% - 32px)", sm: "auto" } }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => {
            setSnackbar(s => ({ ...s, open: false }));
          }}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ── Row sub-component to keep complexity down ───────────────────────────────
function VehicleTableRow({
  vehicle: v,
  togglingId,
  isRestricted,
  onNavigate,
  onDelete,
  onToggleAvailability,
}: {
  readonly vehicle: SupplierVehicleListItem;
  readonly togglingId: string | null;
  readonly isRestricted?: boolean;
  readonly onNavigate: (path: string) => void;
  readonly onDelete: (v: SupplierVehicleListItem) => void;
  readonly onToggleAvailability: (v: SupplierVehicleListItem) => Promise<void>;
}) {
  const canBeAvailable = isApprovedStatus(v.status);
  const isAvailable = v.availabilityStatus.toLowerCase() === "available";
  const isToggling = togglingId === v.vehicleId;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  const switchTooltip = (() => {
    if (isRestricted) return "Account restricted";
    if (!canBeAvailable) return "Only approved vehicles can be made available";
    return isAvailable ? "Set unavailable" : "Set available";
  })();

  return (
    <TableRow
      hover
      sx={{
        "&:last-child td": { border: 0 },
        "&:hover": { bgcolor: t => alpha(t.palette.primary.main, 0.03) },
      }}
    >
      <TableCell sx={{ py: 1.8, pl: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
              bgcolor: t => alpha(t.palette.primary.main, 0.08),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {v.imageUrl ? (
              <Image
                src={(toImageUrl(v.imageUrl) as string) || v.imageUrl}
                alt={`${v.make} ${v.model}`}
                width={120}
                height={90}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <CarIcon fontSize="small" />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
              {v.make} {v.model}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {v.year ? `${String(v.year)} · ` : ""}
              {v.licensePlate || "—"}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Typography sx={{ fontWeight: 700 }} color="primary.main">
          ${v.pricePerDay.toLocaleString()}
          <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
            {" "}
            / day
          </Typography>
        </Typography>
      </TableCell>

      <TableCell>
        <StatusChip status={v.status} />
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Tooltip title={switchTooltip} arrow>
            <span>
              <Switch
                size="small"
                checked={isAvailable}
                disabled={isToggling || (!canBeAvailable && !isAvailable) || isRestricted}
                onChange={() => {
                  void onToggleAvailability(v);
                }}
              />
            </span>
          </Tooltip>
          <AvailabilityChip availability={v.availabilityStatus} />
        </Stack>
      </TableCell>

      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
        <Chip
          size="small"
          label={v.bookingsCount}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            bgcolor: t => alpha(t.palette.primary.main, 0.08),
            color: "primary.main",
          }}
        />
      </TableCell>

      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(v.createdAt)}
        </Typography>
      </TableCell>

      <TableCell align="right" sx={{ pr: 3 }}>
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              sx={{ borderRadius: 2 }}
              onClick={() => {
                onNavigate(`/supplier/vehicles/${v.vehicleId}`);
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!isRestricted && (
            <>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  sx={{ borderRadius: 2 }}
                  onClick={() => {
                    onNavigate(`/supplier/vehicles/${v.vehicleId}`);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  sx={{
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: t => alpha(t.palette.error.main, 0.1),
                      color: "error.main",
                    },
                  }}
                  onClick={() => {
                    onDelete(v);
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

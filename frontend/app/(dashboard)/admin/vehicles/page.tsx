"use client";

// cspell:ignore refetches

import { useState, memo, useCallback, useMemo, useEffect, type JSX } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  LinearProgress,
  InputAdornment,
  MenuItem,
  Pagination,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  type Theme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import {
  EditRounded as EditIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  SearchRounded as SearchIcon,
} from "@mui/icons-material";
import VehicleStats from "@/app/(dashboard)/_components/VehicleStats";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  useVehicles,
  useAdminVehicleStats,
  deleteCar,
  type Vehicle,
  type AdminVehicleFilter,
  type VehicleStatusFilter,
  type VehicleSortBy,
} from "@/api-clients/cars/cars";
import { getSuppliers, type Supplier } from "@/api-clients/suppliers/suppliers";

// ── Static filter option lists. Defined as module-level constants so the
//    dropdowns don't re-create their option arrays on every render and so
//    the labels stay one source of truth between the filter UI and any
//    future status-badge consumers.

const STATUS_OPTIONS: readonly { value: VehicleStatusFilter; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "Available", label: "Available" },
  { value: "FullyBooked", label: "Fully Booked (On Rental)" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Retired", label: "Retired" },
];

const TRANSMISSION_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "", label: "All transmissions" },
  { value: "Automatic", label: "Automatic" },
  { value: "Manual", label: "Manual" },
];

const SORT_OPTIONS: readonly { value: VehicleSortBy; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "priceHigh", label: "Price: High → Low" },
  { value: "priceLow", label: "Price: Low → High" },
];
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";

// ── CONSTANTS ──
const ERROR_MESSAGES: Record<string, string> = {
  "active bookings": "This vehicle cannot be deleted because it has active bookings.",
  "Cannot delete": "You cannot delete this vehicle right now.",
};

const getErrorMessage = (err: unknown): string => {
  let msg = "";
  if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response: { data?: { message?: string } } }).response;
    msg = response.data?.message || "";
  }

  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return value;
  }
  return "Something went wrong. Please try again later.";
};

type StatusColor = "success" | "warning" | "info" | "error";

/**
 * Maps a Vehicle row to one of the four canonical VehicleStatus enum buckets
 * the backend exposes:
 *   - Available     → green
 *   - FullyBooked   → amber (vehicle currently on rental)
 *   - Maintenance   → blue
 *   - Retired       → red (soft-deleted / inactive)
 *
 * Falls back to the raw `category` string for any other backend value so we
 * never silently swallow a state we don't recognize.
 */
const getStatusConfig = (v: Vehicle): { label: string; colorKey: StatusColor } => {
  if (v.isOnRental) return { label: "Fully Booked", colorKey: "warning" };
  const rawStatus = (v.status ?? "").toLowerCase();
  const rawAvail = (v.availabilityStatus ?? "").toLowerCase();
  if (rawStatus === "maintenance" || rawAvail === "maintenance") {
    return { label: "Maintenance", colorKey: "info" };
  }
  if (rawStatus === "retired" || v.category === "Deleted") {
    return { label: "Retired", colorKey: "error" };
  }
  if (v.available) return { label: "Available", colorKey: "success" };
  return { label: "Unavailable", colorKey: "info" };
};

// ── ACTION BUTTONS ──
const ActionButtons = memo(function ActionButtons({
  vehicleId,
  available,
  hasActiveBookings,
  onDelete,
  onNavigate,
}: {
  readonly vehicleId: string;
  readonly available: boolean;
  readonly hasActiveBookings?: boolean;
  readonly onDelete: (id: string, available: boolean, hasBookings?: boolean) => void;
  readonly onNavigate: (path: string) => void;
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
      <Tooltip title="View">
        <IconButton
          size="small"
          onClick={() => {
            onNavigate(`/admin/vehicles/${vehicleId}`);
          }}
          sx={{ borderRadius: 2 }}
        >
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Edit">
        <IconButton
          size="small"
          onClick={() => {
            onNavigate(`/admin/vehicles/${vehicleId}`);
          }}
          sx={{ borderRadius: 2 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={available && !hasActiveBookings ? "Delete" : "Cannot delete rented car"}>
        <span>
          <IconButton
            onClick={() => {
              onDelete(vehicleId, available, hasActiveBookings);
            }}
            size="small"
            disabled={!available || hasActiveBookings}
            sx={{
              borderRadius: 2,
              "&:hover": {
                bgcolor: theme => alpha(theme.palette.error.main, 0.1),
                color: "error.main",
              },
              "&.Mui-disabled": { opacity: 0.3 },
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
});

// ── MOBILE VEHICLE CARD ──
const VehicleMobileCard = memo(function VehicleMobileCard({
  v,
  theme,
  onDelete,
  onNavigate,
}: {
  readonly v: Vehicle;
  readonly theme: Theme;
  readonly onDelete: (id: string, available: boolean, hasBookings?: boolean) => void;
  readonly onNavigate: (path: string) => void;
}) {
  const status = getStatusConfig(v);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "background 0.15s",
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            overflow: "hidden",
            flexShrink: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {v.imageUrl ? (
            <Image
              src={toImageUrl(v.imageUrl) as string}
              alt={`${v.make} ${v.model}`}
              width={100}
              height={80}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <CarIcon fontSize="small" />
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
            {v.make} {v.model}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {v.category || "General"}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={status.label}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: alpha((theme.palette[status.colorKey] as { main: string }).main, 0.15),
                color: (theme.palette[status.colorKey] as { main: string }).main,
              }}
            />
          </Box>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontWeight: 800, color: "primary.main" }}>${v.dailyRate}</Typography>
          <Typography variant="caption" color="text.secondary">
            /day
          </Typography>
        </Box>
      </Stack>

      <ActionButtons
        vehicleId={v.id}
        available={!!v.available}
        hasActiveBookings={v.hasActiveBookings}
        onDelete={onDelete}
        onNavigate={onNavigate}
      />
    </Paper>
  );
});

interface VehicleListContentProps {
  readonly loading: boolean;
  readonly vehicles: Vehicle[];
  readonly listError: string | null;
  readonly isMobile: boolean;
  readonly theme: Theme;
  readonly handleDelete: (id: string, isAvailable: boolean, hasBookings?: boolean) => void;
  readonly handleNavigate: (path: string) => void;
  readonly filtersActive: boolean;
  readonly handleClearFilters: () => void;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly page: number;
  readonly handlePageChange: (_: unknown, v: number) => void;
  readonly refresh: () => void;
}

const VehicleListContent = memo(function VehicleListContent({
  loading,
  vehicles,
  listError,
  isMobile,
  theme,
  handleDelete,
  handleNavigate,
  filtersActive,
  handleClearFilters,
  totalCount,
  totalPages,
  page,
  handlePageChange,
  refresh,
}: VehicleListContentProps): JSX.Element {
  if (loading && vehicles.length === 0 && !listError) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (listError && vehicles.length === 0) {
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
        <Alert
          severity="error"
          variant="outlined"
          sx={{ maxWidth: 460, mx: "auto", borderRadius: 2, mb: 3 }}
          action={
            <Button
              size="small"
              color="error"
              onClick={() => {
                refresh();
              }}
            >
              Retry
            </Button>
          }
        >
          {listError}
        </Alert>
      </Paper>
    );
  }

  if (isMobile) {
    return (
      <MobileVehicleList
        vehicles={vehicles}
        theme={theme}
        handleDelete={handleDelete}
        handleNavigate={handleNavigate}
        filtersActive={filtersActive}
        handleClearFilters={handleClearFilters}
        totalCount={totalCount}
        totalPages={totalPages}
        page={page}
        handlePageChange={handlePageChange}
      />
    );
  }

  return (
    <DesktopVehicleList
      loading={loading}
      vehicles={vehicles}
      theme={theme}
      handleDelete={handleDelete}
      handleNavigate={handleNavigate}
      filtersActive={filtersActive}
      handleClearFilters={handleClearFilters}
      totalCount={totalCount}
      totalPages={totalPages}
      page={page}
      handlePageChange={handlePageChange}
    />
  );
});

interface MobileVehicleListProps {
  readonly vehicles: Vehicle[];
  readonly theme: Theme;
  readonly handleDelete: (id: string, isAvailable: boolean, hasBookings?: boolean) => void;
  readonly handleNavigate: (path: string) => void;
  readonly filtersActive: boolean;
  readonly handleClearFilters: () => void;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly page: number;
  readonly handlePageChange: (_: unknown, v: number) => void;
}

function MobileVehicleList({
  vehicles,
  theme,
  handleDelete,
  handleNavigate,
  filtersActive,
  handleClearFilters,
  totalCount,
  totalPages,
  page,
  handlePageChange,
}: MobileVehicleListProps) {
  return (
    <Box>
      {vehicles.length > 0 ? (
        vehicles.map((v: Vehicle) => (
          <VehicleMobileCard
            key={v.vehicleId || v.id}
            v={v}
            theme={theme}
            onDelete={handleDelete}
            onNavigate={handleNavigate}
          />
        ))
      ) : (
        <EmptyState filtersActive={filtersActive} handleClearFilters={handleClearFilters} />
      )}

      <Stack direction="column" spacing={1} sx={{ alignItems: "center", mt: 2, mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Showing <strong>{vehicles.length}</strong> of {totalCount} vehicles
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          size="small"
          siblingCount={0}
          boundaryCount={1}
          sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
        />
      </Stack>
    </Box>
  );
}

interface DesktopVehicleListProps {
  readonly loading: boolean;
  readonly vehicles: Vehicle[];
  readonly theme: Theme;
  readonly handleDelete: (id: string, isAvailable: boolean, hasBookings?: boolean) => void;
  readonly handleNavigate: (path: string) => void;
  readonly filtersActive: boolean;
  readonly handleClearFilters: () => void;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly page: number;
  readonly handlePageChange: (_: unknown, v: number) => void;
}

function DesktopVehicleList({
  loading,
  vehicles,
  theme,
  handleDelete,
  handleNavigate,
  filtersActive,
  handleClearFilters,
  totalCount,
  totalPages,
  page,
  handlePageChange,
}: DesktopVehicleListProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      {loading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 2,
          }}
        />
      )}
      <TableContainer sx={{ overflowX: "auto", opacity: loading ? 0.6 : 1, transition: "opacity 0.15s ease" }}>
        <Table sx={{ minWidth: 500 }}>
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
              <TableCell sx={{ pl: 6 }}>Vehicle</TableCell>
              <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Category</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Daily Rate</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Supplier</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Year</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Transmission</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell align="right" sx={{ pr: 4 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {vehicles.length > 0 ? (
              vehicles.map((v: Vehicle) => (
                <VehicleTableRow
                  key={v.vehicleId || v.id}
                  v={v}
                  theme={theme}
                  onDelete={handleDelete}
                  onNavigate={handleNavigate}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <EmptyState filtersActive={filtersActive} handleClearFilters={handleClearFilters} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          gap: 1,
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing <strong>{vehicles.length}</strong> of {totalCount} vehicles
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          size="small"
          sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
        />
      </Stack>
    </Paper>
  );
}

function EmptyState({
  filtersActive,
  handleClearFilters,
}: {
  readonly filtersActive: boolean;
  readonly handleClearFilters: () => void;
}) {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Avatar
        sx={{
          width: 64,
          height: 64,
          mx: "auto",
          mb: 2,
          bgcolor: t => alpha(t.palette.text.disabled, 0.1),
        }}
      >
        <SearchIcon sx={{ fontSize: 32, color: "text.disabled" }} />
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
        {filtersActive ? "No vehicles match these filters" : "No vehicles yet"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        {filtersActive
          ? "Try clearing filters or adjusting your search."
          : 'Click "Add New Vehicle" to list your first one.'}
      </Typography>
      {filtersActive && (
        <Button
          size="small"
          variant="outlined"
          onClick={handleClearFilters}
          sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
        >
          Clear filters
        </Button>
      )}
    </Box>
  );
}

function VehicleTableRow({
  v,
  theme,
  onDelete,
  onNavigate,
}: {
  readonly v: Vehicle;
  readonly theme: Theme;
  readonly onDelete: (id: string, available: boolean, hasBookings?: boolean) => void;
  readonly onNavigate: (path: string) => void;
}) {
  const status = getStatusConfig(v);
  const paletteColor = theme.palette[status.colorKey] as {
    main: string;
  };
  const statusColor = paletteColor.main;

  return (
    <TableRow
      hover
      sx={{
        transition: "background 0.15s",
        "&:last-child td": { border: 0 },
        "&:hover": {
          bgcolor: t => alpha(t.palette.primary.main, 0.03),
        },
      }}
    >
      <TableCell sx={{ py: { xs: 1.2, sm: 1.8 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: { xs: 40, sm: 52 },
              height: { xs: 40, sm: 52 },
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
                src={toImageUrl(v.imageUrl) as string}
                alt={`${v.make} ${v.model}`}
                width={420}
                height={300}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <CarIcon fontSize="small" />
            )}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 }, color: "text.primary" }}>
              {v.make} {v.model}
            </Typography>
            <Stack
              direction="row"
              spacing={0.8}
              sx={{ alignItems: "center", display: { xs: "flex", sm: "none" }, mt: 0.3 }}
            >
              <Typography variant="caption" color="text.secondary">
                {v.category}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                ·
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }} color="primary.main">
                ${v.dailyRate}/day
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </TableCell>

      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
        <Chip
          label={v.category || "General"}
          size="small"
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: t => alpha(t.palette.primary.main, 0.08),
            color: "primary.main",
          }}
        />
      </TableCell>

      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
        <Typography sx={{ fontWeight: 700 }} color="primary.main">
          ${v.dailyRate}
          <Typography component="span" sx={{ fontWeight: 400 }} variant="caption" color="text.secondary">
            {" "}
            /day
          </Typography>
        </Typography>
      </TableCell>

      <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }} noWrap>
          {v.supplierName?.trim() || "—"}
        </Typography>
      </TableCell>

      <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
        <Typography variant="body2" color="text.secondary">
          {v.year ?? "—"}
        </Typography>
      </TableCell>

      <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
        <Typography variant="body2" color="text.secondary">
          {v.transmission || "—"}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={status.label}
          size="small"
          sx={{
            textTransform: "capitalize",
            borderRadius: 2,
            bgcolor: alpha(statusColor, 0.15),
            color: statusColor,
            fontWeight: 700,
            fontSize: { xs: 11, sm: 12 },
          }}
        />
      </TableCell>

      <TableCell align="right">
        <ActionButtons
          vehicleId={v.vehicleId || v.id}
          available={!!v.available}
          hasActiveBookings={v.hasActiveBookings}
          onDelete={onDelete}
          onNavigate={onNavigate}
        />
      </TableCell>
    </TableRow>
  );
}

// ── MAIN PAGE ──
export default function AdminCarsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Filter state. Search is debounced inside `useVehicles`; the other four
  //    fields take effect immediately. All four flow into the backend
  //    AdminVehicleFilterRequest so search/filter/sort run on the database
  //    instead of being computed from the paginated array.
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [transmissionFilter, setTransmissionFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<VehicleSortBy>("newest");

  const vehicleFilter = useMemo<AdminVehicleFilter>(
    () => ({
      keyword: search,
      status: statusFilter,
      supplierId: supplierFilter || undefined,
      transmission: transmissionFilter || undefined,
      sortBy,
    }),
    [search, statusFilter, supplierFilter, transmissionFilter, sortBy]
  );

  // True when any filter / search input is non-default. Drives the
  // empty-state copy + the "Clear filters" action.
  const filtersActive = useMemo(
    () =>
      Boolean(search) ||
      Boolean(statusFilter) ||
      Boolean(supplierFilter) ||
      Boolean(transmissionFilter) ||
      sortBy !== "newest",
    [search, statusFilter, supplierFilter, transmissionFilter, sortBy]
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("");
    setSupplierFilter("");
    setTransmissionFilter("");
    setSortBy("newest");
  }, []);

  const {
    vehicles,
    loading,
    error: listError,
    page,
    totalPages,
    totalCount,
    setPage,
    refresh,
  } = useVehicles(session?.accessToken, vehicleFilter);

  // ── Suppliers list for the "Supplier" filter dropdown. Loaded once on mount.
  //    Falls back silently to an empty list — the dropdown still works, it just
  //    won't have any options to pick from. The fetch isn't cancellable; the
  //    extra setState after unmount is benign with React 19 and lets us avoid a
  //    useless flag that lint complains about as a no-op.
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        const result = await getSuppliers(1, 100);
        const list = result.data ?? result.resultData ?? result.items ?? [];
        setSuppliers(list);
      } catch (err) {
        logger.error("Failed to load suppliers for filter dropdown", err);
      }
    })();
  }, []);

  // ── DB-truth stats for the dashboard cards. Counts come from
  //    /api/vehicles/admin/stats so they are independent of pagination,
  //    search, and filter state. `refreshStats()` is called alongside
  //    `refresh()` after a delete so the cards re-sync.
  const { stats: vehicleStats, error: statsError, refresh: refreshStats } = useAdminVehicleStats(session?.accessToken);

  // ── STATS ──
  // Read from the server stats endpoint (not from the paginated `vehicles`
  // array) so the cards always show real database totals across all pages
  // and filters.
  const total = vehicleStats?.totalVehicles ?? 0;
  const availableCount = vehicleStats?.availableVehicles ?? 0;
  const rentalCount = vehicleStats?.onRentalVehicles ?? 0;

  // ── HANDLERS ──
  const handleDelete = useCallback((id: string, isAvailable: boolean, hasBookings?: boolean) => {
    if (hasBookings) {
      setErrorMsg("Cannot delete vehicle with active bookings");
      return;
    }
    if (!isAvailable) {
      setErrorMsg("Cannot delete a vehicle that is not available (e.g. rented)");
      return;
    }
    setDeleteId(id);
    setOpenDelete(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    if (!session?.accessToken) {
      setErrorMsg("No active session. Please sign in.");
      return;
    }
    try {
      await deleteCar(session.accessToken, deleteId);
      setOpenDelete(false);
      setDeleteId(null);
      refresh();
      refreshStats();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
      logger.error("Failed to delete car", err);
    }
  }, [deleteId, session, refresh, refreshStats]);

  const handleCloseDelete = useCallback(() => {
    setOpenDelete(false);
  }, []);
  const handleCloseError = useCallback(() => {
    setErrorMsg(null);
  }, []);
  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const handlePageChange = useCallback(
    (_: unknown, v: number) => {
      setPage(v);
    },
    [setPage]
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, justifyContent: "space-between", mb: 4, alignItems: { xs: "flex-start", sm: "center" } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "1.6rem", md: "2rem" } }}>
            Fleet Inventory
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Manage fleet vehicles
          </Typography>
        </Box>

        <Box
          onClick={() => {
            handleNavigate("/admin/vehicles/create");
          }}
          sx={{
            px: 2.5,
            py: 1.2,
            borderRadius: 2,
            fontWeight: 700,
            color: "primary.contrastText",
            cursor: "pointer",
            background: t => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
            boxShadow: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
            transition: "0.2s",
            whiteSpace: "nowrap",
            alignSelf: { xs: "stretch", sm: "auto" },
            justifyContent: { xs: "center", sm: "flex-start" },
            "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
          }}
        >
          <AddIcon fontSize="small" />
          Add New Vehicle
        </Box>
      </Stack>

      {statsError && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button
              size="small"
              color="warning"
              onClick={() => {
                refreshStats();
              }}
            >
              Retry
            </Button>
          }
        >
          {statsError}
        </Alert>
      )}

      {/* STATS */}
      <VehicleStats total={total} availableCount={availableCount} rentalCount={rentalCount} />

      {/* FILTER ROW — search + four dropdowns. All four flow through `vehicleFilter`
          into the backend; the search input is debounced inside the hook so each
          keystroke doesn't fire a request. */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search make, model, plate, or supplier…"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
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
        <Grid size={{ xs: 6, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value as VehicleStatusFilter);
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
        <Grid size={{ xs: 6, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Supplier"
            value={supplierFilter}
            onChange={e => {
              setSupplierFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            <MenuItem value="">All suppliers</MenuItem>
            {suppliers.map(s => (
              <MenuItem key={s.id} value={s.id}>
                {s.companyProfile?.companyName?.trim() || `${s.firstName} ${s.lastName}`.trim()}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Transmission"
            value={transmissionFilter}
            onChange={e => {
              setTransmissionFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {TRANSMISSION_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Sort by"
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value as VehicleSortBy);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {SORT_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Inline retry banner: shown when a refetch fails but we still have
          rows from the previous successful fetch. Avoids replacing the table
          with a blocking error screen. */}
      {listError && vehicles.length > 0 && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button
              size="small"
              color="warning"
              onClick={() => {
                refresh();
              }}
            >
              Retry
            </Button>
          }
        >
          {listError}
        </Alert>
      )}

      {/* TABLE / MOBILE CARDS */}
      <VehicleListContent
        loading={loading}
        vehicles={vehicles}
        listError={listError}
        isMobile={isMobile}
        theme={theme}
        handleDelete={handleDelete}
        handleNavigate={handleNavigate}
        filtersActive={filtersActive}
        handleClearFilters={handleClearFilters}
        totalCount={totalCount}
        totalPages={totalPages}
        page={page}
        handlePageChange={handlePageChange}
        refresh={refresh}
      />

      {/* DELETE DIALOG */}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: { sx: { borderRadius: 2, p: 1, mx: { xs: 2, sm: "auto" } } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Vehicle</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this vehicle?
          <br />
          <strong>This action cannot be undone.</strong>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, pb: 2, px: 2 }}>
          <Button onClick={handleCloseDelete} variant="outlined" sx={{ borderRadius: 2, flex: { xs: 1, sm: "none" } }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void confirmDelete();
            }}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700, flex: { xs: 1, sm: "none" } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ERROR SNACKBAR */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ maxWidth: { xs: "calc(100% - 32px)", sm: "auto" }, left: { xs: 16, sm: "auto" } }}
      >
        <Alert severity="error" onClose={handleCloseError}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

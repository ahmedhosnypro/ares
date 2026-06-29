"use client";

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
  Checkbox,
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
  CheckCircleOutlineRounded as AvailableIcon,
  BuildOutlined as MaintenanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  useVehicles,
  useAdminVehicleStats,
  deleteCar,
  VehicleStatus,
  type Vehicle,
  type AdminVehicleFilter,
  type VehicleStatusFilter,
  type VehicleSortBy,
} from "@/api-clients/cars/cars";
import { getSuppliers, type Supplier } from "@/api-clients/suppliers/suppliers";
import { getCategories, bulkAssignVehicles, type Category } from "@/api-clients/categories/categories";
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";

interface FleetOverviewProps {
  readonly total: number;
  readonly availableCount: number;
  readonly rentalCount: number;
  readonly maintenanceCount: number;
  readonly trends?: {
    totalAssets?: number;
    available?: number;
    maintenance?: number;
  };
}

function TrendBadge({ value }: Readonly<{ value?: number }>): JSX.Element | null {
  if (value === undefined) return null;
  const isUp = value >= 0;
  return (
    <Stack direction="row" spacing={0.3} sx={{ alignItems: "center" }}>
      {isUp ? (
        <TrendingUpIcon sx={{ fontSize: 13, color: "success.main" }} />
      ) : (
        <TrendingDownIcon sx={{ fontSize: 13, color: "error.main" }} />
      )}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          fontSize: 11,
          color: isUp ? "success.main" : "error.main",
        }}
      >
        {isUp ? "+" : ""}
        {value}%
      </Typography>
    </Stack>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  iconColor,
}: Readonly<{
  icon: JSX.Element;
  label: string;
  value: number;
  trend?: number;
  iconColor: string;
}>): JSX.Element {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: alpha(iconColor, 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <TrendBadge value={trend} />
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", mt: 1 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, sm: 32 }, lineHeight: 1.1 }}>
        {value.toLocaleString()}
      </Typography>
    </Paper>
  );
}

function LegendItem({ color, label, pct }: Readonly<{ color: string; label: string; pct: number }>): JSX.Element {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
      <Stack direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            bgcolor: color,
            flexShrink: 0,
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12, minWidth: 32, textAlign: "right" }}>
        {pct}%
      </Typography>
    </Stack>
  );
}

function DonutChart({
  available,
  booked,
  maintenance,
  unavailable,
  total,
}: Readonly<{
  available: number;
  booked: number;
  maintenance: number;
  unavailable: number;
  total: number;
}>): JSX.Element {
  const theme = useTheme();

  const safeTotal = total || 1;
  const availPct = (available / safeTotal) * 100;
  const bookedPct = (booked / safeTotal) * 100;
  const maintenancePct = (maintenance / safeTotal) * 100;
  const unavailablePct = (unavailable / safeTotal) * 100;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  interface Segment {
    pct: number;
    color: string;
    offset: number;
  }

  const segments: Segment[] = useMemo(() => {
    const segmentsData: { pct: number; color: string }[] = [
      { pct: availPct, color: theme.palette.success.main },
      { pct: bookedPct, color: theme.palette.primary.main },
      { pct: maintenancePct, color: theme.palette.warning.main },
      { pct: unavailablePct, color: theme.palette.info.main },
    ];
    let cumulative = 0;
    return segmentsData.map(s => {
      const offset = (cumulative / 100) * circumference;
      cumulative += s.pct;
      return { ...s, offset };
    });
  }, [availPct, bookedPct, maintenancePct, unavailablePct, circumference, theme]);

  return (
    <Box sx={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
      <svg viewBox="0 0 110 110" width={110} height={110}>
        <circle cx="55" cy="55" r={radius} fill="none" stroke={theme.palette.divider} strokeWidth="10" />
        <g transform="rotate(-90 55 55)">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${(seg.pct / 100) * circumference} ${circumference}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
            />
          ))}
        </g>
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{total}</Typography>
      </Box>
    </Box>
  );
}

function FleetOverview({
  total,
  availableCount,
  rentalCount,
  maintenanceCount,
  trends,
}: FleetOverviewProps): JSX.Element {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.vehicles");

  const unavailableCount = Math.max(0, total - (availableCount + rentalCount + maintenanceCount));
  const safeTotal = total || 1;
  const availPct = Math.round((availableCount / safeTotal) * 100);
  const bookedPct = Math.round((rentalCount / safeTotal) * 100);
  const maintenancePct = Math.round((maintenanceCount / safeTotal) * 100);
  const unavailablePct = Math.round((unavailableCount / safeTotal) * 100);

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 12, md: 4.5 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
            <DonutChart
              available={availableCount}
              booked={rentalCount}
              maintenance={maintenanceCount}
              unavailable={unavailableCount}
              total={total}
            />
            <Stack spacing={0.5} sx={{ flex: 1 }}>
              <LegendItem color={theme.palette.success.main} label={t("statusLabels.available")} pct={availPct} />
              <LegendItem color={theme.palette.primary.main} label={t("statusLabels.booked")} pct={bookedPct} />
              <LegendItem
                color={theme.palette.warning.main}
                label={t("statusLabels.maintenance")}
                pct={maintenancePct}
              />
              <LegendItem color={theme.palette.info.main} label={t("statusLabels.unavailable")} pct={unavailablePct} />
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
        <StatCard
          icon={<CarIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />}
          label={t("stats.totalAssets")}
          value={total}
          trend={trends?.totalAssets}
          iconColor={theme.palette.primary.main}
        />
      </Grid>

      <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
        <StatCard
          icon={<AvailableIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />}
          label={t("stats.availableNow")}
          value={availableCount}
          trend={trends?.available}
          iconColor={theme.palette.success.main}
        />
      </Grid>

      <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
        <StatCard
          icon={<MaintenanceIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />}
          label={t("stats.inMaintenance")}
          value={maintenanceCount}
          trend={trends?.maintenance}
          iconColor={theme.palette.warning.main}
        />
      </Grid>
    </Grid>
  );
}

const STATUS_OPTIONS: readonly { value: VehicleStatusFilter; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: VehicleStatus.Available, label: "Available" },
  { value: VehicleStatus.FullyBooked, label: "Fully Booked (On Rental)" },
  { value: VehicleStatus.Maintenance, label: "Maintenance" },
  { value: VehicleStatus.Retired, label: "Retired" },
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

const getErrorMessage = (err: unknown, t: (key: string) => string): string => {
  let msg = "";
  if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response: { data?: { message?: string } } }).response;
    msg = response.data?.message || "";
  }

  if (msg.includes("active bookings")) {
    return t("errors.activeBookings");
  }
  if (msg.includes("Cannot delete")) {
    return t("errors.cannotDeleteRented");
  }
  return t("errors.generic");
};

type StatusColor = "success" | "warning" | "info" | "error";

const getStatusConfig = (v: Vehicle, t: (key: string) => string): { label: string; colorKey: StatusColor } => {
  if (v.isOnRental) return { label: t("statusLabels.fullyBooked"), colorKey: "warning" };
  const rawStatus = (v.status ?? "").toLowerCase();
  const rawAvail = (v.availabilityStatus ?? "").toLowerCase();
  if (rawStatus === "maintenance" || rawAvail === "maintenance") {
    return { label: t("statusLabels.maintenance"), colorKey: "info" };
  }
  if (rawStatus === "retired" || v.category === "Deleted") {
    return { label: t("statusLabels.retired"), colorKey: "error" };
  }
  if (v.available) return { label: t("statusLabels.available"), colorKey: "success" };
  return { label: t("statusLabels.unavailable"), colorKey: "info" };
};

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
  const t = useTranslations("dashboardAdmin.vehicles");

  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
      <Tooltip title={t("tooltips.view")}>
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

      <Tooltip title={t("tooltips.edit")}>
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

      <Tooltip title={available && !hasActiveBookings ? t("tooltips.delete") : t("tooltips.cannotDeleteRented")}>
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
  const t = useTranslations("dashboardAdmin.vehicles");
  const status = getStatusConfig(v, t);

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
            {v.categoryName || v.category || "General"}
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
            /{t("tableHeaders.dailyRate").split(" ").pop() || "day"}
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
  readonly selectedVehicleIds: Set<string>;
  readonly toggleVehicleSelection: (id: string) => void;
  readonly toggleSelectAll: () => void;
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
  selectedVehicleIds,
  toggleVehicleSelection,
  toggleSelectAll,
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
      selectedVehicleIds={selectedVehicleIds}
      toggleVehicleSelection={toggleVehicleSelection}
      toggleSelectAll={toggleSelectAll}
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
  const t = useTranslations("dashboardAdmin.vehicles");

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
          {t("showingCount", { count: vehicles.length, total: totalCount })}
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
  readonly selectedVehicleIds: Set<string>;
  readonly toggleVehicleSelection: (id: string) => void;
  readonly toggleSelectAll: () => void;
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
  selectedVehicleIds,
  toggleVehicleSelection,
  toggleSelectAll,
}: DesktopVehicleListProps) {
  const t = useTranslations("dashboardAdmin.vehicles");
  const allSelected = vehicles.length > 0 && vehicles.every(v => selectedVehicleIds.has(v.vehicleId || v.id));
  const someSelected = vehicles.some(v => selectedVehicleIds.has(v.vehicleId || v.id)) && !allSelected;

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
              <TableCell padding="checkbox" sx={{ pl: 2 }}>
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleSelectAll}
                  color="primary"
                />
              </TableCell>
              <TableCell sx={{ pl: 2 }}>{t("tableHeaders.vehicle")}</TableCell>
              <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{t("tableHeaders.category")}</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{t("tableHeaders.dailyRate")}</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>{t("tableHeaders.supplier")}</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>{t("tableHeaders.year")}</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>{t("tableHeaders.transmission")}</TableCell>
              <TableCell>{t("tableHeaders.availability")}</TableCell>
              <TableCell align="right" sx={{ pr: 4 }}>
                {t("tableHeaders.actions")}
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
                  selected={selectedVehicleIds.has(v.vehicleId || v.id)}
                  onToggle={() => {
                    toggleVehicleSelection(v.vehicleId || v.id);
                  }}
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
          {t("showingCount", { count: vehicles.length, total: totalCount })}
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
  const t = useTranslations("dashboardAdmin.vehicles");

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
        {filtersActive ? t("emptyState.noMatchTitle") : t("emptyState.noVehiclesTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        {filtersActive ? t("emptyState.noMatchDesc") : t("emptyState.noVehiclesDesc")}
      </Typography>
      {filtersActive && (
        <Button
          size="small"
          variant="outlined"
          onClick={handleClearFilters}
          sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
        >
          {t("emptyState.clearFiltersBtn")}
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
  selected,
  onToggle,
}: {
  readonly v: Vehicle;
  readonly theme: Theme;
  readonly onDelete: (id: string, available: boolean, hasBookings?: boolean) => void;
  readonly onNavigate: (path: string) => void;
  readonly selected: boolean;
  readonly onToggle: () => void;
}) {
  const t = useTranslations("dashboardAdmin.vehicles");
  const status = getStatusConfig(v, t);
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
      <TableCell padding="checkbox" sx={{ pl: 2 }}>
        <Checkbox size="small" checked={selected} onChange={onToggle} color="primary" />
      </TableCell>
      <TableCell sx={{ py: { xs: 1.2, sm: 1.8 }, pl: 2 }}>
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
                {v.categoryName || v.category || "General"}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                ·
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }} color="primary.main">
                ${v.dailyRate}/{t("tableHeaders.dailyRate").split(" ").pop() || "day"}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </TableCell>

      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
        <Chip
          label={v.categoryName || v.category || "General"}
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
            /{t("tableHeaders.dailyRate").split(" ").pop() || "day"}
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
          {v.transmission === "Automatic"
            ? t("transmissions.automatic")
            : v.transmission === "Manual"
              ? t("transmissions.manual")
              : v.transmission || "—"}
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

export default function AdminCarsPage() {
  const theme = useTheme();
  const router = useRouter();
  const t = useTranslations("dashboardAdmin.vehicles");
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [openBulkAssign, setOpenBulkAssign] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);

  const searchParams = useSearchParams();
  const initialCategoryId = searchParams.get("categoryId") || "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [transmissionFilter, setTransmissionFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<VehicleSortBy>("newest");
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>(initialCategoryId);

  useEffect(() => {
    const paramVal = searchParams.get("categoryId");
    if (paramVal !== null) {
      setCategoryIdFilter(paramVal);
    }
  }, [searchParams]);

  const vehicleFilter = useMemo<AdminVehicleFilter>(
    () => ({
      keyword: search,
      status: statusFilter,
      supplierId: supplierFilter || undefined,
      transmission: transmissionFilter || undefined,
      sortBy,
      categoryId: categoryIdFilter || undefined,
    }),
    [search, statusFilter, supplierFilter, transmissionFilter, sortBy, categoryIdFilter]
  );

  const filtersActive = useMemo(
    () =>
      Boolean(search) ||
      Boolean(statusFilter) ||
      Boolean(supplierFilter) ||
      Boolean(transmissionFilter) ||
      Boolean(categoryIdFilter) ||
      sortBy !== "newest",
    [search, statusFilter, supplierFilter, transmissionFilter, sortBy, categoryIdFilter]
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("");
    setSupplierFilter("");
    setTransmissionFilter("");
    setSortBy("newest");
    setCategoryIdFilter("");
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

      try {
        const catResult = await getCategories();
        setCategories(catResult);
      } catch (err) {
        logger.error("Failed to load categories for bulk assign", err);
      }
    })();
  }, []);

  const { stats: vehicleStats, error: statsError, refresh: refreshStats } = useAdminVehicleStats(session?.accessToken);

  const total = vehicleStats?.totalVehicles ?? 0;
  const availableCount = vehicleStats?.availableVehicles ?? 0;
  const rentalCount = vehicleStats?.onRentalVehicles ?? 0;
  const maintenanceCount = vehicleStats?.maintenanceVehicles ?? 0;

  const handleDelete = useCallback(
    (id: string, isAvailable: boolean, hasBookings?: boolean) => {
      if (hasBookings) {
        setErrorMsg(t("errors.activeBookings"));
        return;
      }
      if (!isAvailable) {
        setErrorMsg(t("errors.cannotDeleteRented"));
        return;
      }
      setDeleteId(id);
      setOpenDelete(true);
    },
    [t]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    if (!session?.accessToken) {
      setErrorMsg(t("errors.sessionExpired"));
      return;
    }
    try {
      await deleteCar(session.accessToken, deleteId);
      setOpenDelete(false);
      setDeleteId(null);
      refresh();
      refreshStats();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, t));
      logger.error("Failed to delete car", err);
    }
  }, [deleteId, session, refresh, refreshStats, t]);

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

  const toggleVehicleSelection = useCallback((id: string) => {
    setSelectedVehicleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (vehicles.length === 0) return;
    const currentIds = vehicles.map(v => v.vehicleId || v.id);
    const allSelected = currentIds.every(id => selectedVehicleIds.has(id));

    setSelectedVehicleIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        currentIds.forEach(id => next.delete(id));
      } else {
        currentIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [vehicles, selectedVehicleIds]);

  const handleBulkAssignSubmit = async () => {
    if (!selectedCategoryId || selectedVehicleIds.size === 0) return;

    setBulkAssignLoading(true);
    try {
      await bulkAssignVehicles(selectedCategoryId, Array.from(selectedVehicleIds));
      setOpenBulkAssign(false);
      setSelectedVehicleIds(new Set());
      refresh();
      refreshStats();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, t));
    } finally {
      setBulkAssignLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, justifyContent: "space-between", mb: 4, alignItems: { xs: "flex-start", sm: "center" } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "1.6rem", md: "2rem" } }}>
            {t("inventoryTitle")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {t("inventorySubtitle")}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>
          {selectedVehicleIds.size > 0 && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setOpenBulkAssign(true);
              }}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              {t("bulkAssignBtn", { count: selectedVehicleIds.size })}
            </Button>
          )}

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
              justifyContent: { xs: "center", sm: "flex-start" },
              "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
            }}
          >
            <AddIcon fontSize="small" />
            {t("addBtn")}
          </Box>
        </Stack>
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

      <FleetOverview
        total={total}
        availableCount={availableCount}
        rentalCount={rentalCount}
        maintenanceCount={maintenanceCount}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t("searchVehiclesPlaceholder")}
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
        <Grid size={{ xs: 6, sm: 4, md: 1.8 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("categoryFilterLabel")}
            value={categoryIdFilter}
            onChange={e => {
              setCategoryIdFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            <MenuItem value="">{t("allCategoriesOpt")}</MenuItem>
            {categories.map(c => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 1.8 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("statusFilterLabel")}
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value as VehicleStatusFilter);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.value === ""
                  ? t("allStatusesOpt")
                  : opt.value === "Available"
                    ? t("statusLabels.available")
                    : opt.value === "FullyBooked"
                      ? t("statusLabels.fullyBooked")
                      : opt.value === "Maintenance"
                        ? t("statusLabels.maintenance")
                        : t("statusLabels.retired")}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 1.8 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("supplierFilterLabel")}
            value={supplierFilter}
            onChange={e => {
              setSupplierFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            <MenuItem value="">{t("allSuppliersOpt")}</MenuItem>
            {suppliers.map(s => (
              <MenuItem key={s.id} value={s.id}>
                {s.companyProfile?.companyName?.trim() || `${s.firstName} ${s.lastName}`.trim()}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 1.8 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("transmissionFilterLabel")}
            value={transmissionFilter}
            onChange={e => {
              setTransmissionFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {TRANSMISSION_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.value === ""
                  ? t("allTransmissionsOpt")
                  : opt.value === "Automatic"
                    ? t("transmissions.automatic")
                    : opt.value === "Manual"
                      ? t("transmissions.manual")
                      : opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 1.8 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("sortByFilterLabel")}
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value as VehicleSortBy);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {SORT_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.value === "newest"
                  ? t("sortOptions.newest")
                  : opt.value === "oldest"
                    ? t("sortOptions.oldest")
                    : opt.value === "priceHigh"
                      ? t("sortOptions.priceHigh")
                      : t("sortOptions.priceLow")}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

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
        selectedVehicleIds={selectedVehicleIds}
        toggleVehicleSelection={toggleVehicleSelection}
        toggleSelectAll={toggleSelectAll}
      />

      <Dialog
        open={openBulkAssign}
        onClose={() => {
          setOpenBulkAssign(false);
        }}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: { sx: { borderRadius: 2, p: 1, mx: { xs: 2, sm: "auto" } } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("bulkAssignTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            {t("bulkAssignDesc", { count: selectedVehicleIds.size })}
          </Typography>
          <TextField
            select
            fullWidth
            label={t("categoryFilterLabel")}
            value={selectedCategoryId}
            onChange={e => {
              setSelectedCategoryId(e.target.value);
            }}
          >
            <MenuItem value="" disabled>
              {t("selectCategoryPlaceholder")}
            </MenuItem>
            {categories.map(c => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, pb: 2, px: 2 }}>
          <Button
            onClick={() => {
              setOpenBulkAssign(false);
            }}
            variant="outlined"
            sx={{ borderRadius: 2, flex: { xs: 1, sm: "none" } }}
            disabled={bulkAssignLoading}
          >
            {t("cancelBtn")}
          </Button>
          <Button
            onClick={() => {
              void handleBulkAssignSubmit();
            }}
            color="primary"
            variant="contained"
            disabled={!selectedCategoryId || bulkAssignLoading}
            sx={{ borderRadius: 2, fontWeight: 700, flex: { xs: 1, sm: "none" } }}
          >
            {bulkAssignLoading ? <CircularProgress size={24} color="inherit" /> : t("confirmBtn")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: { sx: { borderRadius: 2, p: 1, mx: { xs: 2, sm: "auto" } } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("deleteDialog.title")}</DialogTitle>
        <DialogContent>{t("deleteDialog.message")}</DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, pb: 2, px: 2 }}>
          <Button onClick={handleCloseDelete} variant="outlined" sx={{ borderRadius: 2, flex: { xs: 1, sm: "none" } }}>
            {t("deleteDialog.cancel")}
          </Button>
          <Button
            onClick={() => {
              void confirmDelete();
            }}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700, flex: { xs: 1, sm: "none" } }}
          >
            {t("deleteDialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

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

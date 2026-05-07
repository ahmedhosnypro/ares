"use client";

import React, { useState, memo, useCallback } from "react";
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
  InputAdornment,
  Card,
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
  Theme,
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
  CheckCircleTwoTone as AvailableIcon,
  KeyTwoTone as RentalIcon,
  AssessmentTwoTone as InventoryIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useVehicles, deleteCar, type Vehicle } from "@/api-clients/cars/cars";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
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

type StatusColor = "error" | "success" | "warning";

const getStatusConfig = (v: Vehicle): { label: string; colorKey: StatusColor } => {
  if (v.category === "Deleted") return { label: "Not Available", colorKey: "error" };
  if (v.available) return { label: "Available", colorKey: "success" };
  return { label: "Rented", colorKey: "warning" };
};

// ── STAT CARD ──
interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

const StatCard = memo(function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
        background: theme =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(color, 0.08)} 100%)`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: () => `0 8px 24px ${alpha(color, 0.18)}`,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -18,
          right: -18,
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: alpha(color, 0.1),
        }}
      />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.15), color, width: 40, height: 40 }}>{icon}</Avatar>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {label}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color, lineHeight: 1.1, fontSize: { xs: "1.6rem", sm: "2.125rem" } }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
});

// ── ACTION BUTTONS ──
const ActionButtons = memo(function ActionButtons({
  vehicleId,
  available,
  hasActiveBookings,
  onDelete,
  onNavigate,
}: {
  vehicleId: string;
  available: boolean;
  hasActiveBookings?: boolean;
  onDelete: (id: string, available: boolean, hasBookings?: boolean) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
      <Tooltip title="View">
        <IconButton
          size="small"
          onClick={() => {
            onNavigate(`/admin/cars/${vehicleId}`);
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
            onNavigate(`/admin/cars/${vehicleId}/edit`);
          }}
          sx={{ borderRadius: 2 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={!available ? "Delete" : "Cannot delete rented car"}>
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
            <DeleteIcon fontSize="small" />
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
  v: Vehicle;
  theme: Theme;
  onDelete: (id: string, available: boolean, hasBookings?: boolean) => void;
  onNavigate: (path: string) => void;
}) {
  const status = getStatusConfig(v);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
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

// ── MAIN PAGE ──
export default function AdminCarsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { vehicles, loading, page, totalPages, setPage, refresh } = useVehicles(session?.accessToken);

  // ── FILTER ──
  const q = search.toLowerCase();
  const filtered = vehicles.filter(
    (v: Vehicle) => v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
  );

  // ── STATS ──
  const total = vehicles.length;
  const availableCount = vehicles.filter((v: Vehicle) => v.available).length;
  const rentalCount = vehicles.filter((v: Vehicle) => !v.available).length;

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
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
      logger.error("Failed to delete car", err);
    }
  }, [deleteId, session, refresh]);

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

  const mainContent = (() => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (isMobile) {
      return (
        /* ── MOBILE: card list ── */
        <Box>
          {filtered.length > 0 ? (
            filtered.map((v: Vehicle) => (
              <VehicleMobileCard
                key={v.vehicleId || v.id}
                v={v}
                theme={theme}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
              />
            ))
          ) : (
            <Box sx={{ py: 8, textAlign: "center", opacity: 0.6 }}>
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
                No vehicles found
              </Typography>
            </Box>
          )}

          {/* PAGINATION mobile */}
          <Stack direction="column" spacing={1} sx={{ alignItems: "center", mt: 2, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing <strong>{filtered.length}</strong> of {total} vehicles
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => {
                setPage(v);
              }}
              size="small"
              siblingCount={0}
              boundaryCount={1}
              sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
            />
          </Stack>
        </Box>
      );
    }

    return (
      /* ── DESKTOP: table ── */
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ overflowX: "auto" }}>
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
                <TableCell>Availability</TableCell>
                <TableCell align="right" sx={{ pr: 4 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((v: Vehicle) => {
                  const status = getStatusConfig(v);
                  const paletteColor = theme.palette[status.colorKey] as {
                    main: string;
                  };
                  const statusColor = paletteColor.main;

                  return (
                    <TableRow
                      key={v.vehicleId || v.id}
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
                          <Typography
                            component="span"
                            sx={{ fontWeight: 400 }}
                            variant="caption"
                            color="text.secondary"
                          >
                            {" "}
                            /day
                          </Typography>
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
                          onDelete={handleDelete}
                          onNavigate={handleNavigate}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Box sx={{ textAlign: "center", opacity: 0.6 }}>
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
                        No vehicles found
                      </Typography>
                    </Box>
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
            Showing <strong>{filtered.length}</strong> of {total} vehicles
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => {
              setPage(v);
            }}
            size="small"
            sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
          />
        </Stack>
      </Paper>
    );
  })();

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
            handleNavigate("/admin/cars/create");
          }}
          sx={{
            px: 2.5,
            py: 1.2,
            borderRadius: 3,
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

      {/* STATS */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Total Assets"
            value={total}
            color={theme.palette.primary.main}
            icon={<InventoryIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard
            label="Available"
            value={availableCount}
            color={theme.palette.success.main}
            icon={<AvailableIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard
            label="On Rental"
            value={rentalCount}
            color={theme.palette.warning.main}
            icon={<RentalIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      {/* FILTER */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by make or model..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
          }}
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "background.paper" } }}
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
      </Stack>

      {/* TABLE / MOBILE CARDS */}
      {mainContent}

      {/* DELETE DIALOG */}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: { sx: { borderRadius: 3, p: 1, mx: { xs: 2, sm: "auto" } } },
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

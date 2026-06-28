"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  EditOutlined as EditIcon,
  HistoryOutlined as HistoryIcon,
  CloudUploadOutlined as ImportIcon,
  CloudDownloadOutlined as ExportIcon,
  BuildOutlined as MaintenanceIcon,
  DirectionsCarFilledOutlined as CarIcon,
  CheckCircleOutlined as ActiveIcon,
  BlockOutlined as OutOfServiceIcon,
} from "@mui/icons-material";
import { logger } from "@/utils/logger";

type VehicleStatus = "active" | "maintenance" | "outOfService";

interface VehicleItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly location: string;
  readonly plate: string;
  readonly status: VehicleStatus;
}

interface HistoryEntry {
  readonly id: string;
  readonly vehicleId: string;
  readonly date: string;
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly reason: string;
  readonly user: string;
}

const INITIAL_VEHICLES: readonly VehicleItem[] = [
  { id: "1", name: "Tesla Model Y", category: "SUV", location: "Downtown DXB", plate: "DXB-98124", status: "active" },
  {
    id: "2",
    name: "Mercedes C-Class",
    category: "Sedan",
    location: "Airport Terminal 3",
    plate: "DXB-77291",
    status: "maintenance",
  },
  { id: "3", name: "Chevrolet Tahoe", category: "SUV", location: "Marina Hub", plate: "DXB-10821", status: "active" },
  { id: "4", name: "Audi A6", category: "Sedan", location: "Downtown DXB", plate: "DXB-55610", status: "outOfService" },
  {
    id: "5",
    name: "Ford Explorer",
    category: "SUV",
    location: "Airport Terminal 1",
    plate: "DXB-33490",
    status: "active",
  },
];

const INITIAL_HISTORY: readonly HistoryEntry[] = [
  {
    id: "h1",
    vehicleId: "4",
    date: "2026-06-25",
    fromStatus: "active",
    toStatus: "outOfService",
    reason: "Pending radiator repair parts",
    user: "Admin (John Doe)",
  },
  {
    id: "h2",
    vehicleId: "2",
    date: "2026-06-26",
    fromStatus: "active",
    toStatus: "maintenance",
    reason: "Routine 50,000 km service",
    user: "Fleet Mgr (Sarah)",
  },
];

export default function VehiclesView() {
  const t = useTranslations("dashboardAdmin.admin.vehicles");

  const [vehicles, setVehicles] = useState<readonly VehicleItem[]>(INITIAL_VEHICLES);
  const [history, setHistory] = useState<readonly HistoryEntry[]>(INITIAL_HISTORY);

  // Filtering states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<VehicleItem | null>(null);
  const [newStatus, setNewStatus] = useState<VehicleStatus>("active");
  const [statusReason, setStatusReason] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyVehicle, setHistoryVehicle] = useState<VehicleItem | null>(null);

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState("changeStatus");

  // Loading/feedback states
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Handle individual selection
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) || v.plate.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vehicles, search, statusFilter, categoryFilter]);

  const handleSelectAll = () => {
    setSelectedIds(filteredVehicles.map(v => v.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  // Open Status Dialog
  const openStatusDialog = (vehicle: VehicleItem) => {
    setActiveVehicle(vehicle);
    setNewStatus(vehicle.status);
    setStatusReason("");
    setExpectedReturnDate("");
    setStatusDialogOpen(true);
  };

  // Save status change
  const handleSaveStatus = () => {
    if (!activeVehicle) return;

    // Update vehicle status
    setVehicles(prev => prev.map(v => (v.id === activeVehicle.id ? { ...v, status: newStatus } : v)));

    // Create history entry
    const newEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      vehicleId: activeVehicle.id,
      date: new Date().toISOString().split("T")[0],
      fromStatus: activeVehicle.status,
      toStatus: newStatus,
      reason: statusReason || "Manual status override",
      user: "Admin",
    };

    setHistory(prev => [newEntry, ...prev]);
    setStatusDialogOpen(false);
    setSnackbarSeverity("success");
    setSnackbarMessage(t("statusDialog.successAlert"));
    logger.info(`Status updated for vehicle ${activeVehicle.name} (${activeVehicle.plate}) to ${newStatus}`);
  };

  // Open History Dialog
  const openHistoryDialog = (vehicle: VehicleItem) => {
    setHistoryVehicle(vehicle);
    setHistoryDialogOpen(true);
  };

  // Handle simulated Import CSV
  const handleImportCsv = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setSnackbarSeverity("success");
      setSnackbarMessage(t("alerts.importSuccess"));
      logger.info("Imported fleet database from CSV schema.");
    }, 2000);
  };

  // Handle simulated Export
  const handleExportData = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setSnackbarSeverity("success");
      setSnackbarMessage(t("alerts.exportSuccess"));
      logger.info("Downloaded fleet database export.");
    }, 1500);
  };

  // Handle Bulk Action
  const handleApplyBulkAction = () => {
    if (selectedIds.length === 0) return;

    if (bulkActionType === "changeStatus") {
      setVehicles(prev => prev.map(v => (selectedIds.includes(v.id) ? { ...v, status: "maintenance" } : v)));
      logger.info(`Bulk updated status to maintenance for vehicles: ${selectedIds.join(", ")}`);
    }

    setBulkDialogOpen(false);
    setSelectedIds([]);
    setSnackbarSeverity("success");
    setSnackbarMessage(t("bulkDialog.successAlert").replace("{count}", selectedIds.length.toString()));
  };

  // Categories list for filter
  const categories = useMemo(() => {
    const list = new Set(vehicles.map(v => v.category));
    return Array.from(list);
  }, [vehicles]);

  // Get status chips helper
  const getStatusChip = (status: "active" | "maintenance" | "outOfService") => {
    switch (status) {
      case "active":
        return (
          <Chip
            icon={<ActiveIcon sx={{ color: "status.active.contrastText" }} />}
            label={t("statuses.active")}
            sx={{ bgcolor: "status.active.light", color: "status.active.contrastText", fontWeight: 700 }}
          />
        );
      case "maintenance":
        return (
          <Chip
            icon={<MaintenanceIcon sx={{ color: "status.pending.contrastText" }} />}
            label={t("statuses.maintenance")}
            sx={{ bgcolor: "status.pending.light", color: "status.pending.contrastText", fontWeight: 700 }}
          />
        );
      case "outOfService":
        return (
          <Chip
            icon={<OutOfServiceIcon sx={{ color: "status.blocked.contrastText" }} />}
            label={t("statuses.outOfService")}
            sx={{ bgcolor: "status.blocked.light", color: "status.blocked.contrastText", fontWeight: 700 }}
          />
        );
    }
  };

  // Counts for Stats overview
  const totalCount = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === "active").length;
  const maintenanceCount = vehicles.filter(v => v.status === "maintenance").length;
  const blockedCount = vehicles.filter(v => v.status === "outOfService").length;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Section */}
      <Stack
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 4,
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
            {t("title")}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {t("subtitle")}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={isImporting ? <CircularProgress size={16} color="inherit" /> : <ImportIcon />}
            onClick={handleImportCsv}
            disabled={isImporting || isExporting}
          >
            {t("actions.importCsv")}
          </Button>
          <Button
            variant="outlined"
            startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <ExportIcon />}
            onClick={handleExportData}
            disabled={isImporting || isExporting}
          >
            {t("actions.exportData")}
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "border.main", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "rgba(15, 91, 91, 0.08)",
                  color: "primary.main",
                  display: "flex",
                }}
              >
                <CarIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {t("stats.totalAssets")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                  {totalCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "border.main", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "status.active.light",
                  color: "status.active.main",
                  display: "flex",
                }}
              >
                <ActiveIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {t("stats.available")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "status.active.main" }}>
                  {availableCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "border.main", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "status.pending.light",
                  color: "status.pending.main",
                  display: "flex",
                }}
              >
                <MaintenanceIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {t("stats.inMaintenance")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "status.pending.main" }}>
                  {maintenanceCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "border.main", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "status.blocked.light",
                  color: "status.blocked.main",
                  display: "flex",
                }}
              >
                <OutOfServiceIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {t("stats.outOfService")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "status.blocked.main" }}>
                  {blockedCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Table Section */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "border.main", bgcolor: "background.paper", mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Controls Bar */}
          <Stack
            sx={{
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "center" },
              mb: 3,
              gap: 2,
            }}
          >
            <Stack sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 2, flexGrow: 1 }}>
              <TextField
                placeholder={t("table.searchPlaceholder")}
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                }}
                sx={{ maxWidth: { sm: 260 } }}
              />
              <TextField
                select
                label={t("table.status")}
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                }}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="all">{t("table.allStatuses")}</MenuItem>
                <MenuItem value="active">{t("statuses.active")}</MenuItem>
                <MenuItem value="maintenance">{t("statuses.maintenance")}</MenuItem>
                <MenuItem value="outOfService">{t("statuses.outOfService")}</MenuItem>
              </TextField>
              <TextField
                select
                label={t("table.category")}
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                }}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="all">{t("table.allCategories")}</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Button
              variant="contained"
              disabled={selectedIds.length === 0}
              onClick={() => {
                setBulkDialogOpen(true);
              }}
              sx={{ bgcolor: selectedIds.length > 0 ? "primary.main" : "text.disabled" }}
            >
              {t("actions.bulkAction")} ({selectedIds.length})
            </Button>
          </Stack>

          {/* Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: "none", bgcolor: "transparent" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < filteredVehicles.length}
                      checked={filteredVehicles.length > 0 && selectedIds.length === filteredVehicles.length}
                      onChange={e => {
                        if (e.target.checked) {
                          handleSelectAll();
                        } else {
                          handleClearAll();
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.vehicle")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.category")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.location")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.status")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    {t("table.action")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVehicles.map(vehicle => {
                  const isChecked = selectedIds.includes(vehicle.id);
                  return (
                    <TableRow key={vehicle.id} hover selected={isChecked}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isChecked}
                          onChange={() => {
                            handleSelectOne(vehicle.id);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{vehicle.name}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {vehicle.plate}
                        </Typography>
                      </TableCell>
                      <TableCell>{vehicle.category}</TableCell>
                      <TableCell>{vehicle.location}</TableCell>
                      <TableCell>{getStatusChip(vehicle.status)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              openStatusDialog(vehicle);
                            }}
                            title={t("actions.editStatus")}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              openHistoryDialog(vehicle);
                            }}
                            title={t("actions.statusHistory")}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredVehicles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ color: "text.secondary" }}>{t("table.empty")}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog: Edit Status */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("statusDialog.title")}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
          {activeVehicle && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                {activeVehicle.name}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {activeVehicle.plate}
              </Typography>
            </Box>
          )}

          <TextField
            select
            label={t("statusDialog.selectStatus")}
            value={newStatus}
            onChange={e => {
              setNewStatus(e.target.value as "active" | "maintenance" | "outOfService");
            }}
          >
            <MenuItem value="active">{t("statuses.active")}</MenuItem>
            <MenuItem value="maintenance">{t("statuses.maintenance")}</MenuItem>
            <MenuItem value="outOfService">{t("statuses.outOfService")}</MenuItem>
          </TextField>

          <TextField
            label={t("statusDialog.reason")}
            value={statusReason}
            onChange={e => {
              setStatusReason(e.target.value);
            }}
            multiline
            rows={3}
          />

          {(newStatus === "maintenance" || newStatus === "outOfService") && (
            <TextField
              label={t("statusDialog.expectedReturn")}
              type="date"
              value={expectedReturnDate}
              onChange={e => {
                setExpectedReturnDate(e.target.value);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setStatusDialogOpen(false);
            }}
            variant="outlined"
          >
            {t("statusDialog.cancel")}
          </Button>
          <Button onClick={handleSaveStatus} variant="contained" sx={{ bgcolor: "primary.main" }}>
            {t("statusDialog.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Status History */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("historyDialog.title")} {historyVehicle && `— ${historyVehicle.name} (${historyVehicle.plate})`}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t("historyDialog.date")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("historyDialog.statusChange")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("historyDialog.reason")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("historyDialog.user")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyVehicle &&
                  history
                    .filter(h => h.vehicleId === historyVehicle.id)
                    .map(h => (
                      <TableRow key={h.id}>
                        <TableCell>{h.date}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {t(`statuses.${h.fromStatus}`)} → {t(`statuses.${h.toStatus}`)}
                        </TableCell>
                        <TableCell>{h.reason}</TableCell>
                        <TableCell>{h.user}</TableCell>
                      </TableRow>
                    ))}
                {(!historyVehicle || history.filter(h => h.vehicleId === historyVehicle.id).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: "text.secondary" }}>{t("historyDialog.empty")}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setHistoryDialogOpen(false);
            }}
            variant="contained"
            sx={{ bgcolor: "primary.main" }}
          >
            {t("historyDialog.close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Bulk Action */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => {
          setBulkDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("bulkDialog.title")}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("bulkDialog.affectingCount", { count: selectedIds.length })}
          </Typography>

          <TextField
            select
            label={t("bulkDialog.selectAction")}
            value={bulkActionType}
            onChange={e => {
              setBulkActionType(e.target.value);
            }}
          >
            <MenuItem value="changeStatus">{t("bulkDialog.changeStatusMaintenance")}</MenuItem>
            <MenuItem value="updatePricing">{t("bulkDialog.updatePricing")}</MenuItem>
            <MenuItem value="assignLocation">{t("bulkDialog.assignLocation")}</MenuItem>
            <MenuItem value="updateAvailability">{t("bulkDialog.updateAvailability")}</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setBulkDialogOpen(false);
            }}
            variant="outlined"
          >
            {t("bulkDialog.cancel")}
          </Button>
          <Button onClick={handleApplyBulkAction} variant="contained" sx={{ bgcolor: "primary.main" }}>
            {t("bulkDialog.apply")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={snackbarMessage !== ""}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbarMessage("");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbarSeverity}
          variant="filled"
          onClose={() => {
            setSnackbarMessage("");
          }}
          sx={{ borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

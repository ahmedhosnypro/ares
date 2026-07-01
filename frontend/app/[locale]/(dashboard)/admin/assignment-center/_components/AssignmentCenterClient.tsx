"use client";

import { useState, useMemo, type JSX } from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  useTheme,
  alpha,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import RefreshIcon from "@mui/icons-material/Refresh";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import {
  assignInspectorToBooking,
  getPendingAssignments,
  type PendingAssignment,
} from "@/api-clients/inspections/inspections";
import { type Inspector } from "@/api-clients/inspectors/inspectors";
import StatCard from "@/app/[locale]/(dashboard)/_components/StatCard";

interface Props {
  readonly initialAssignments: PendingAssignment[];
  readonly inspectors: Inspector[];
}

export default function AssignmentCenterClient({ initialAssignments, inspectors }: Props): JSX.Element {
  const theme = useTheme();

  const [assignments, setAssignments] = useState<PendingAssignment[]>(initialAssignments);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Assignment states map (bookingId -> inspectorId, assigning boolean)
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [assigningIds, setAssigningIds] = useState<Record<string, boolean>>({});

  const pendingPickups = assignments.filter(a => a.inspectionType === "Pickup").length;
  const pendingReturns = assignments.filter(a => a.inspectionType === "Return").length;
  const availableInspectors = inspectors.length;

  const handleRefresh = async () => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const data = await getPendingAssignments();
      setAssignments(data || []);
      setSuccessMsg("Assignments refreshed successfully.");
    } catch (error) {
      setErrorMsg("Failed to refresh assignments.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (bookingId: string) => {
    const inspectorId = selections[bookingId];
    if (!inspectorId) return;

    setSuccessMsg(null);
    setErrorMsg(null);
    setAssigningIds(prev => ({ ...prev, [bookingId]: true }));
    try {
      await assignInspectorToBooking(bookingId, { inspectorUserId: inspectorId });
      setSuccessMsg("Inspector assigned successfully.");
      // Remove from table
      setAssignments(prev => prev.filter(a => a.bookingId !== bookingId));
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to assign inspector.");
    } finally {
      setAssigningIds(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchesSearch =
        (a.bookingNumber && a.bookingNumber.toLowerCase().includes(search.toLowerCase())) ||
        a.customerName.toLowerCase().includes(search.toLowerCase()) ||
        a.vehicleDisplayName.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "All" || a.inspectionType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [assignments, search, typeFilter]);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 800, mb: 1 }}>
            Inspector Assignment Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quickly assign inspectors to pending bookings.
          </Typography>
        </Box>
        <Button
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          variant="outlined"
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => { setSuccessMsg(null); }}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => { setErrorMsg(null); }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending Pickups"
            value={pendingPickups.toString()}
            color="warning"
            icon={<DirectionsCarIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending Returns"
            value={pendingReturns.toString()}
            color="success"
            icon={<AssignmentReturnIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Available Inspectors"
            value={availableInspectors.toString()}
            color="info"
            icon={<EngineeringIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Pending"
            value={assignments.length.toString()}
            color="primary"
            icon={<PendingActionsIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search booking, customer, vehicle..."
              value={search}
              onChange={e => { setSearch(e.target.value); }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Inspection Type</InputLabel>
              <Select value={typeFilter} label="Inspection Type" onChange={e => { setTypeFilter(e.target.value); }}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Pickup">Pickup</MenuItem>
                <MenuItem value="Return">Return</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Booking Number</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Current Inspector</TableCell>
              <TableCell sx={{ fontWeight: 600, width: "300px" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No pending assignments found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAssignments.map(row => (
                <TableRow key={`${row.bookingId}-${row.inspectionType}`} hover>
                  <TableCell>{row.bookingNumber || "N/A"}</TableCell>
                  <TableCell>{row.customerName}</TableCell>
                  <TableCell>{row.vehicleDisplayName}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.inspectionType}
                      size="small"
                      sx={{
                        bgcolor:
                          row.inspectionType === "Pickup"
                            ? alpha(theme.palette.status.pending.main, 0.15)
                            : alpha(theme.palette.status.active.main, 0.15),
                        color:
                          row.inspectionType === "Pickup"
                            ? theme.palette.status.pending.main
                            : theme.palette.status.active.main,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>{new Date(row.inspectionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                      Not Assigned
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select
                          displayEmpty
                          value={selections[row.bookingId] || ""}
                          onChange={e =>
                            { setSelections(prev => ({ ...prev, [row.bookingId]: e.target.value })); }
                          }
                          renderValue={selected => {
                            if (!selected)
                              return (
                                <Typography variant="body2" color="text.secondary">
                                  Select Inspector
                                </Typography>
                              );
                            const insp = inspectors.find(i => i.userId === selected);
                            return (
                              <Typography variant="body2">
                                {insp ? `${insp.firstName} ${insp.lastName}` : "Unknown"}
                              </Typography>
                            );
                          }}
                        >
                          <MenuItem disabled value="">
                            Select Inspector
                          </MenuItem>
                          {inspectors.map(insp => (
                            <MenuItem key={insp.userId} value={insp.userId}>
                              {insp.firstName} {insp.lastName} - {insp.employeeCode}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          assigningIds[row.bookingId] ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <AssignmentIndIcon />
                          )
                        }
                        disabled={!selections[row.bookingId] || assigningIds[row.bookingId]}
                        onClick={() => handleAssign(row.bookingId)}
                      >
                        Assign
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

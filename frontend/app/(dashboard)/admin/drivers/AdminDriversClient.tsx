"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Rating,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { toApiUrl } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import { format } from "date-fns";

interface ServiceAreaDto {
  id: string;
  name: string;
  governorate: string;
  isActive: boolean;
}

interface DriverListItem {
  driverProfileId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  status: string;
  availability: string;
  isActive: boolean;
  averageRating: number;
  totalTrips: number;
  createdAt: string;
}

interface DriverDetails {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  licenseImage?: string;
  nationalIdFrontImage?: string;
  nationalIdBackImage?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: string;
  availability: string;
  isActive: boolean;
  rejectionReason?: string;
  workAreas: ServiceAreaDto[];
  totalTrips: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS = ["All", "Incomplete", "PendingVerification", "Verified", "Rejected", "Suspended"];

function statusColor(status: string): "default" | "warning" | "success" | "error" | "info" {
  switch (status) {
    case "Verified":
      return "success";
    case "PendingVerification":
      return "warning";
    case "Rejected":
    case "Suspended":
      return "error";
    case "Incomplete":
      return "info";
    default:
      return "default";
  }
}

export default function AdminDriversClient() {
  const { data: session } = useSession();
  const theme = useTheme();
  const token = session?.accessToken;

  const [tab, setTab] = useState(0); // 0 = All, 1 = Pending
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState<DriverDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectField, setShowRejectField] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const url =
        tab === 1
          ? "/api/admin/drivers/pending"
          : statusFilter !== "All"
            ? `/api/admin/drivers?status=${encodeURIComponent(statusFilter)}`
            : "/api/admin/drivers";
      const res = await fetch(toApiUrl(url), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load drivers");
      setDrivers(await res.json());
    } catch (err) {
      logger.error("Error loading admin drivers", err);
      setError("Could not load drivers.");
    } finally {
      setIsLoading(false);
    }
  }, [token, tab, statusFilter]);

  useEffect(() => {
    void fetchDrivers();
  }, [fetchDrivers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(d =>
      [d.firstName, d.lastName, d.email, d.phoneNumber].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [drivers, search]);

  const openDetails = useCallback(
    async (id: string) => {
      if (!token) return;
      setSelectedId(id);
      setDetailsOpen(true);
      setDetails(null);
      setActionError("");
      setShowRejectField(false);
      setRejectReason("");
      setDetailsLoading(true);
      try {
        const res = await fetch(toApiUrl(`/api/admin/drivers/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load driver details");
        setDetails(await res.json());
      } catch (err) {
        logger.error("Error loading driver details", err);
        setActionError("Could not load driver details.");
      } finally {
        setDetailsLoading(false);
      }
    },
    [token]
  );

  const runAction = useCallback(
    async (action: "approve" | "reject" | "enable" | "disable") => {
      if (!token || !selectedId) return;
      if (action === "reject" && !showRejectField) {
        setShowRejectField(true);
        return;
      }
      setActionBusy(true);
      setActionError("");
      try {
        const res = await fetch(toApiUrl(`/api/admin/drivers/${selectedId}/${action}`), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(action === "reject" ? { "Content-Type": "application/json" } : {}),
          },
          body: action === "reject" ? JSON.stringify({ rejectionReason: rejectReason.trim() }) : undefined,
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || `Failed to ${action} driver`);
        }
        setDetailsOpen(false);
        await fetchDrivers();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : `Failed to ${action} driver`);
      } finally {
        setActionBusy(false);
      }
    },
    [token, selectedId, showRejectField, rejectReason, fetchDrivers]
  );

  const fullName = (d: { firstName?: string; lastName?: string }) =>
    [d.firstName, d.lastName].filter(Boolean).join(" ") || "—";

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
        Driver Management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Review driver documents, verify, approve or reject applications, and enable or disable accounts.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
          }}
          aria-label="driver tabs"
        >
          <Tab label="All Drivers" />
          <Tab label="Pending Verification" />
        </Tabs>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          label="Search by name, email or phone"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
          }}
          sx={{ minWidth: 280 }}
        />
        {tab === 0 && (
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
            }}
            sx={{ minWidth: 200 }}
          >
            {STATUS_FILTERS.map(s => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 8, textAlign: "center", borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}
        >
          <Typography variant="h6" color="text.secondary">
            No drivers found
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Availability</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.driverProfileId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{fullName(d)}</TableCell>
                  <TableCell>{d.email || "—"}</TableCell>
                  <TableCell>
                    <Chip label={d.status} color={statusColor(d.status)} size="small" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>{d.availability}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Rating value={d.averageRating} readOnly size="small" precision={0.5} />
                      <Typography variant="caption" color="text.secondary">
                        ({d.totalTrips})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={d.isActive ? "Active" : "Disabled"}
                      color={d.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => openDetails(d.driverProfileId)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Details dialog */}
      <Dialog open={detailsOpen} onClose={() => !actionBusy && setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Driver Details</DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : details ? (
            <Stack spacing={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Avatar
                  src={details.profilePictureUrl ? toImageUrl(details.profilePictureUrl) : undefined}
                  sx={{ width: 64, height: 64 }}
                >
                  {details.firstName?.[0] ?? "D"}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {fullName(details)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                    <Chip label={details.status} color={statusColor(details.status)} size="small" />
                    <Chip label={`Availability: ${details.availability}`} size="small" variant="outlined" />
                    <Chip
                      label={details.isActive ? "Active" : "Disabled"}
                      color={details.isActive ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box sx={{ ml: "auto", textAlign: "right" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
                    <Rating value={details.averageRating} readOnly size="small" precision={0.5} />
                    <Typography variant="caption" color="text.secondary">
                      ({details.totalTrips} trips)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    EMAIL
                  </Typography>
                  <Typography variant="body2">{details.email || "—"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    PHONE
                  </Typography>
                  <Typography variant="body2">{details.phoneNumber || "—"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    LICENSE NUMBER
                  </Typography>
                  <Typography variant="body2">{details.licenseNumber || "—"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    LICENSE EXPIRY
                  </Typography>
                  <Typography variant="body2">
                    {details.licenseExpiryDate ? format(new Date(details.licenseExpiryDate), "MMM d, yyyy") : "—"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    ADDRESS
                  </Typography>
                  <Typography variant="body2">{details.address || "—"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    EMERGENCY CONTACT
                  </Typography>
                  <Typography variant="body2">
                    {details.emergencyContactName || "—"}
                    {details.emergencyContactPhone ? ` (${details.emergencyContactPhone})` : ""}
                  </Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Work Areas
                </Typography>
                {details.workAreas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No work areas selected.
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {details.workAreas.map(a => (
                      <Chip key={a.id} label={`${a.name} (${a.governorate})`} size="small" />
                    ))}
                  </Box>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Documents
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: "Driver License", url: details.licenseImage },
                    { label: "National ID (Front)", url: details.nationalIdFrontImage },
                    { label: "National ID (Back)", url: details.nationalIdBackImage },
                  ].map(doc => (
                    <Grid size={{ xs: 12, sm: 4 }} key={doc.label}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {doc.label}
                      </Typography>
                      {doc.url ? (
                        <Box
                          component="a"
                          href={toImageUrl(doc.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: "block", mt: 0.5 }}
                        >
                          <Box
                            component="img"
                            src={toImageUrl(doc.url)}
                            alt={doc.label}
                            sx={{
                              width: "100%",
                              height: 130,
                              objectFit: "cover",
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Not uploaded
                        </Typography>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {details.status === "Rejected" && details.rejectionReason && (
                <Alert severity="error" variant="outlined">
                  <strong>Rejection reason:</strong> {details.rejectionReason}
                </Alert>
              )}

              {showRejectField && (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Rejection reason"
                  value={rejectReason}
                  onChange={e => {
                    setRejectReason(e.target.value);
                  }}
                />
              )}

              {actionError && <Alert severity="error">{actionError}</Alert>}
            </Stack>
          ) : (
            <Alert severity="error">{actionError || "No details available."}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexWrap: "wrap", gap: 1 }}>
          <Button
            onClick={() => {
              setDetailsOpen(false);
            }}
            color="inherit"
            disabled={actionBusy}
          >
            Close
          </Button>
          <Box sx={{ flex: 1 }} />
          {details && details.status !== "Verified" && (
            <Button variant="contained" color="success" disabled={actionBusy} onClick={() => runAction("approve")}>
              Approve
            </Button>
          )}
          {details && details.status !== "Rejected" && (
            <Button
              variant="outlined"
              color="error"
              disabled={actionBusy || (showRejectField && !rejectReason.trim())}
              onClick={() => runAction("reject")}
            >
              {showRejectField ? "Confirm Reject" : "Reject"}
            </Button>
          )}
          {details &&
            (details.isActive ? (
              <Button variant="outlined" color="warning" disabled={actionBusy} onClick={() => runAction("disable")}>
                Disable
              </Button>
            ) : (
              <Button variant="outlined" color="primary" disabled={actionBusy} onClick={() => runAction("enable")}>
                Enable
              </Button>
            ))}
          {actionBusy && <CircularProgress size={22} sx={{ ml: 1 }} />}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

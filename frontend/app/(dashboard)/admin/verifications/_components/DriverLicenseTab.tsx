"use client";

/**
 * Driver License Verification tab. Mirrors the patterns established by
 * `IdentityVerificationTab` so the admin verification page keeps a single
 * coherent look and feel across both review workflows.
 *
 * - Same MUI components (Paper / Table / Chip / Dialog).
 * - Same status colour scheme: pending = warning, verified = success,
 *   rejected = error. Pending rows/cards get a subtle warning tint so they
 *   stand out at a glance.
 * - Same view/approve/reject flow, including the required-reason rejection
 *   modal already used for identity verifications.
 * - Reuses the existing admin driver-license API client; no new endpoints
 *   are introduced from this component.
 */

import { useCallback, useEffect, useState } from "react";
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
  FormControl,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
  type SelectChangeEvent,
  type Theme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  type AdminDriverLicenseDto,
  approveDriverLicense,
  getAdminDriverLicenses,
  rejectDriverLicense,
} from "@/api-clients/admin-driver-licenses/admin-driver-licenses";
import { logger } from "@/utils/logger";

const PAGE_SIZE = 10;

/**
 * Resolve the server status string to a MUI palette colour. We accept both
 * the canonical values ("Pending" / "Verified" / "Rejected") and the
 * lower-cased forms in case the backend ever changes serialisation.
 */
function getStatusColor(theme: Theme, status: string): string {
  const s = status.toLowerCase();
  if (s === "verified" || s === "approved") return theme.palette.success.main;
  if (s === "rejected") return theme.palette.error.main;
  return theme.palette.warning.main; // pending / unknown
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function resolveImageSrc(serverRelativeUrl: string | null): string | null {
  if (!serverRelativeUrl) return null;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  // The DTO carries server-relative paths like "/uploads/driver-licenses/...".
  return `${base}${serverRelativeUrl}`;
}

export default function DriverLicenseTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [licenses, setLicenses] = useState<AdminDriverLicenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<AdminDriverLicenseDto | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminDriverLicenses(page, PAGE_SIZE, statusFilter);
      setLicenses(data.data);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      logger.error("Failed to fetch driver licenses", err);
      setToast({ open: true, message: "Failed to fetch driver licenses", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchLicenses();
  }, [fetchLicenses]);

  const handleApprove = async (id: string) => {
    try {
      await approveDriverLicense(id);
      setToast({ open: true, message: "Driver license approved successfully", severity: "success" });
      void fetchLicenses();
    } catch (err) {
      logger.error("Failed to approve driver license", err);
      setToast({ open: true, message: "Failed to approve driver license", severity: "error" });
    }
  };

  const handleReject = async () => {
    if (!selectedLicense || !rejectReason.trim()) return;

    setRejectLoading(true);
    try {
      await rejectDriverLicense(selectedLicense.id, rejectReason.trim());
      setToast({ open: true, message: "Driver license rejected successfully", severity: "success" });
      setRejectModalOpen(false);
      setRejectReason("");
      void fetchLicenses();
    } catch (err) {
      logger.error("Failed to reject driver license", err);
      setToast({ open: true, message: "Failed to reject driver license", severity: "error" });
    } finally {
      setRejectLoading(false);
    }
  };

  const openRejectModal = (l: AdminDriverLicenseDto) => {
    setSelectedLicense(l);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const openViewModal = (l: AdminDriverLicenseDto) => {
    setSelectedLicense(l);
    setViewModalOpen(true);
  };

  const isPending = (status: string) => status.toLowerCase() === "pending";

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (licenses.length === 0) {
      return (
        <Paper sx={{ borderRadius: 3, p: 4, textAlign: "center", opacity: 0.6 }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
            No driver license requests found
          </Typography>
        </Paper>
      );
    }

    if (isMobile) {
      return (
        <Box>
          {licenses.map(l => {
            const status = l.status;
            const color = getStatusColor(theme, status);
            const pending = isPending(status);

            return (
              <Paper
                key={l.id}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  ...(pending && {
                    borderColor: alpha(theme.palette.warning.main, 0.5),
                    bgcolor: alpha(theme.palette.warning.main, 0.04),
                  }),
                }}
              >
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.light,
                        fontWeight: 700,
                        width: 40,
                        height: 40,
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {l.userFirstName[0] ?? "?"}
                      {l.userLastName[0] ?? ""}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
                        {l.userFirstName} {l.userLastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {l.userEmail}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    label={status}
                    size="small"
                    sx={{
                      ml: 1,
                      flexShrink: 0,
                      textTransform: "capitalize",
                      bgcolor: alpha(color, 0.15),
                      color: color,
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  />
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  License #: <strong>{l.licenseNumber}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Expiry: <strong>{formatDate(l.licenseExpiryDate)}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  Submitted: {formatDate(l.submittedAt)}
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      openViewModal(l);
                    }}
                  >
                    View
                  </Button>
                  {pending && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => void handleApprove(l.id)}
                        sx={{ color: "common.white" }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => {
                          openRejectModal(l);
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </Stack>
              </Paper>
            );
          })}
          <Stack direction="column" spacing={1} sx={{ alignItems: "center", mt: 2, mb: 1 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => {
                setPage(v);
              }}
              size="small"
            />
          </Stack>
        </Box>
      );
    }

    return (
      <Paper sx={{ borderRadius: 3 }}>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>User Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>License Number</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {licenses.map(l => {
                const status = l.status;
                const color = getStatusColor(theme, status);
                const pending = isPending(status);

                return (
                  <TableRow
                    key={l.id}
                    hover
                    sx={pending ? { bgcolor: alpha(theme.palette.warning.main, 0.04) } : undefined}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.light,
                            fontWeight: 700,
                            width: 40,
                            height: 40,
                            fontSize: 16,
                          }}
                        >
                          {l.userFirstName[0] ?? "?"}
                          {l.userLastName[0] ?? ""}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                          {l.userFirstName} {l.userLastName}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {l.userEmail}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {l.licenseNumber}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{formatDate(l.licenseExpiryDate)}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={status}
                        size="small"
                        sx={{
                          textTransform: "capitalize",
                          bgcolor: alpha(color, 0.15),
                          color: color,
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{formatDate(l.submittedAt)}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => {
                              openViewModal(l);
                            }}
                            size="small"
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {pending && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton onClick={() => void handleApprove(l.id)} size="small" color="success">
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                onClick={() => {
                                  openRejectModal(l);
                                }}
                                size="small"
                                color="error"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 1, justifyContent: "space-between", alignItems: "center", p: 2 }}
        >
          <Typography variant="caption">Total Records: {totalCount}</Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => {
              setPage(v);
            }}
            size="small"
          />
        </Stack>
      </Paper>
    );
  };

  const selectedImageSrc = selectedLicense ? resolveImageSrc(selectedLicense.licenseImageUrl) : null;

  return (
    <Box>
      {/* FILTER — matches the identity tab so admins have a consistent control surface. */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: { xs: "100%", sm: 180 } }} size={isMobile ? "small" : "medium"}>
          <Select
            value={statusFilter}
            onChange={(e: SelectChangeEvent) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            displayEmpty
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Verified">Verified</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* CONTENT */}
      {renderContent()}

      {/* VIEW MODAL */}
      <Dialog
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Driver License Details</DialogTitle>
        <DialogContent dividers>
          {selectedLicense && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  User
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedLicense.userFirstName} {selectedLicense.userLastName}
                </Typography>
                <Typography variant="body2">{selectedLicense.userEmail}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  License Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedLicense.licenseNumber}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Expiry Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatDate(selectedLicense.licenseExpiryDate)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedLicense.status}
                  size="small"
                  sx={{
                    textTransform: "capitalize",
                    bgcolor: alpha(getStatusColor(theme, selectedLicense.status), 0.15),
                    color: getStatusColor(theme, selectedLicense.status),
                    fontWeight: 700,
                    mt: 0.5,
                  }}
                />
              </Box>

              {selectedLicense.status.toLowerCase() === "rejected" && selectedLicense.rejectionReason && (
                <Box>
                  <Typography variant="subtitle2" color="error.main">
                    Rejection Reason
                  </Typography>
                  <Typography variant="body1">{selectedLicense.rejectionReason}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  License Image
                </Typography>
                {selectedImageSrc ? (
                  <Box
                    component="img"
                    src={selectedImageSrc}
                    alt="Driver License"
                    sx={{ width: "100%", borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                  />
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    No image provided
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setViewModalOpen(false);
            }}
          >
            Close
          </Button>
          {selectedLicense?.status.toLowerCase() === "pending" && (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  setViewModalOpen(false);
                  openRejectModal(selectedLicense);
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                sx={{ color: "common.white" }}
                onClick={() => {
                  setViewModalOpen(false);
                  void handleApprove(selectedLicense.id);
                }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* REJECT MODAL */}
      <Dialog
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Driver License</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this driver license. This will be visible to the user.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectReason}
            onChange={e => {
              setRejectReason(e.target.value);
            }}
            required
            error={rejectReason.trim() === ""}
            helperText={rejectReason.trim() === "" ? "Reason is required" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectModalOpen(false);
            }}
            disabled={rejectLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleReject()}
            disabled={rejectLoading || rejectReason.trim() === ""}
          >
            {rejectLoading ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => {
          setToast({ ...toast, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => {
            setToast({ ...toast, open: false });
          }}
          severity={toast.severity}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

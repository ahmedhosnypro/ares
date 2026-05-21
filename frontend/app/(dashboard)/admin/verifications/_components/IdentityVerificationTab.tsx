"use client";

/**
 * Identity Verification tab — extracted verbatim from the legacy admin
 * verifications page so behaviour, look-and-feel, and API integration are
 * preserved exactly. The only changes are:
 *   1. Top-level <Box> wrapper is collapsed (the tabs container provides padding).
 *   2. The page-level <Typography> title is removed (rendered by the parent page).
 *
 * Everything else — table layout, mobile card layout, status colours,
 * approve / reject flow, modals, and the snackbar — is unchanged.
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
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  type AdminVerificationDto,
  approveVerification,
  getAdminVerifications,
  rejectVerification,
} from "@/api-clients/admin-verifications/admin-verifications";
import { logger } from "@/utils/logger";

const PAGE_SIZE = 10;

export default function IdentityVerificationTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [verifications, setVerifications] = useState<AdminVerificationDto[]>([]);
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
  const [selectedVerification, setSelectedVerification] = useState<AdminVerificationDto | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminVerifications(page, PAGE_SIZE, statusFilter);
      setVerifications(data.data);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      logger.error("Failed to fetch verifications", err);
      setToast({ open: true, message: "Failed to fetch verifications", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchVerifications();
  }, [fetchVerifications]);

  const handleApprove = async (id: string) => {
    try {
      await approveVerification(id);
      setToast({ open: true, message: "Verification approved successfully", severity: "success" });
      void fetchVerifications();
    } catch (err) {
      logger.error("Failed to approve verification", err);
      setToast({ open: true, message: "Failed to approve verification", severity: "error" });
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectReason.trim()) return;

    setRejectLoading(true);
    try {
      await rejectVerification(selectedVerification.id, rejectReason.trim());
      setToast({ open: true, message: "Verification rejected successfully", severity: "success" });
      setRejectModalOpen(false);
      setRejectReason("");
      void fetchVerifications();
    } catch (err) {
      logger.error("Failed to reject verification", err);
      setToast({ open: true, message: "Failed to reject verification", severity: "error" });
    } finally {
      setRejectLoading(false);
    }
  };

  const openRejectModal = (v: AdminVerificationDto) => {
    setSelectedVerification(v);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const openViewModal = (v: AdminVerificationDto) => {
    setSelectedVerification(v);
    setViewModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") return theme.palette.success.main;
    if (s === "rejected") return theme.palette.error.main;
    return theme.palette.warning.main; // pending
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (verifications.length === 0) {
      return (
        <Paper sx={{ borderRadius: 3, p: 4, textAlign: "center", opacity: 0.6 }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
            No verification requests found
          </Typography>
        </Paper>
      );
    }

    if (isMobile) {
      return (
        <Box>
          {verifications.map(v => {
            const status = v.status.toLowerCase();
            const color = getStatusColor(status);

            return (
              <Paper
                key={v.id}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  ...(status === "pending" && {
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
                      {v.userFirstName[0]}
                      {v.userLastName[0]}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
                        {v.userFirstName} {v.userLastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {v.userEmail}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    label={v.status}
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

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Type: <strong>{v.documentType}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  Date: {new Date(v.submittedAt).toLocaleDateString()}
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      openViewModal(v);
                    }}
                  >
                    View
                  </Button>
                  {status === "pending" && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => void handleApprove(v.id)}
                        sx={{ color: "common.white" }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => {
                          openRejectModal(v);
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
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {verifications.map(v => {
                const status = v.status.toLowerCase();
                const color = getStatusColor(status);

                return (
                  <TableRow
                    key={v.id}
                    hover
                    sx={status === "pending" ? { bgcolor: alpha(theme.palette.warning.main, 0.04) } : undefined}
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
                          {v.userFirstName[0]}
                          {v.userLastName[0]}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                            {v.userFirstName} {v.userLastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {v.userEmail}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {v.documentType}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{new Date(v.submittedAt).toLocaleDateString()}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={v.status}
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

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => {
                              openViewModal(v);
                            }}
                            size="small"
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {status === "pending" && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton onClick={() => void handleApprove(v.id)} size="small" color="success">
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                onClick={() => {
                                  openRejectModal(v);
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

  return (
    <Box>
      {/* FILTER */}
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
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
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
        <DialogTitle sx={{ fontWeight: 700 }}>Verification Details</DialogTitle>
        <DialogContent dividers>
          {selectedVerification && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  User
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedVerification.userFirstName} {selectedVerification.userLastName}
                </Typography>
                <Typography variant="body2">{selectedVerification.userEmail}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Document Type
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedVerification.documentType}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedVerification.status}
                  size="small"
                  sx={{
                    textTransform: "capitalize",
                    bgcolor: alpha(getStatusColor(selectedVerification.status), 0.15),
                    color: getStatusColor(selectedVerification.status),
                    fontWeight: 700,
                    mt: 0.5,
                  }}
                />
              </Box>

              {selectedVerification.status.toLowerCase() === "rejected" && selectedVerification.rejectionReason && (
                <Box>
                  <Typography variant="subtitle2" color="error.main">
                    Rejection Reason
                  </Typography>
                  <Typography variant="body1">{selectedVerification.rejectionReason}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Front Image
                </Typography>
                {selectedVerification.documentFrontUrl ? (
                  <Box
                    component="img"
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}${selectedVerification.documentFrontUrl}`}
                    alt="Front Document"
                    sx={{ width: "100%", borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                  />
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    No image provided
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Back Image
                </Typography>
                {selectedVerification.documentBackUrl ? (
                  <Box
                    component="img"
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}${selectedVerification.documentBackUrl}`}
                    alt="Back Document"
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
          {selectedVerification?.status.toLowerCase() === "pending" && (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  setViewModalOpen(false);
                  openRejectModal(selectedVerification);
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
                  void handleApprove(selectedVerification.id);
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
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Verification</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this verification request. This will be visible to the user.
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

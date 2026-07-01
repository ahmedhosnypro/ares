"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { formatUtcDate } from "@/utils/dateTime";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Skeleton,
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { Theme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import VehicleStats, { type StatItem } from "@/app/[locale]/(dashboard)/_components/VehicleStats";
import {
  type AdminDriverPayoutListItem,
  type PlatformDriverEarningsSummary,
  approveAdminPayout,
  getAdminPendingPayouts,
  getAdminPendingVerifications,
  getAdminPlatformSummary,
  rejectAdminPayout,
  retryAdminPayout,
  verifyAdminWallet,
} from "@/api-clients/admin-driver-earnings/admin-driver-earnings";
import { logger } from "@/utils/logger";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string, locale: string): string {
  return formatUtcDate(iso, locale);
}

function safeNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function getPayoutStatusColor(status: string, theme: Theme): string {
  const s = status.toLowerCase();
  if (s === "completed" || s === "approved") return theme.palette.success.main;
  if (s === "rejected" || s === "failed") return theme.palette.error.main;
  if (s === "pending") return theme.palette.warning.main;
  return theme.palette.info.main;
}

export default function AdminDriverEarningsClient() {
  const theme = useTheme();
  const locale = useLocale();
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;

  const [summary, setSummary] = useState<PlatformDriverEarningsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [pendingPayouts, setPendingPayouts] = useState<AdminDriverPayoutListItem[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  const [pendingVerifications, setPendingVerifications] = useState<AdminDriverPayoutListItem[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(true);

  const [toast, setToast] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminDriverPayoutListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (sessionStatus === "loading" || !accessToken) return;
    try {
      setSummaryLoading(true);
      const data = await getAdminPlatformSummary(accessToken);
      setSummary(data);
    } catch (err) {
      logger.error("Failed to load platform summary", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [accessToken, sessionStatus]);

  const fetchPendingPayouts = useCallback(async () => {
    if (sessionStatus === "loading" || !accessToken) return;
    try {
      setPayoutsLoading(true);
      const data = await getAdminPendingPayouts(accessToken);
      setPendingPayouts(data);
    } catch (err) {
      logger.error("Failed to load pending payouts", err);
    } finally {
      setPayoutsLoading(false);
    }
  }, [accessToken, sessionStatus]);

  const fetchPendingVerifications = useCallback(async () => {
    if (sessionStatus === "loading" || !accessToken) return;
    try {
      setVerificationsLoading(true);
      const data = await getAdminPendingVerifications(accessToken);
      setPendingVerifications(data);
    } catch (err) {
      logger.error("Failed to load pending verifications", err);
    } finally {
      setVerificationsLoading(false);
    }
  }, [accessToken, sessionStatus]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchPendingPayouts();
  }, [fetchPendingPayouts]);

  useEffect(() => {
    void fetchPendingVerifications();
  }, [fetchPendingVerifications]);

  const refreshAll = useCallback(() => {
    void fetchSummary();
    void fetchPendingPayouts();
    void fetchPendingVerifications();
  }, [fetchSummary, fetchPendingPayouts, fetchPendingVerifications]);

  const handleApprove = useCallback(
    async (payout: AdminDriverPayoutListItem) => {
      if (!accessToken) return;
      const confirmed = window.confirm(`Approve payout of ${formatCurrency(payout.amount)} for ${payout.driverName}?`);
      if (!confirmed) return;
      try {
        setActionLoading(true);
        await approveAdminPayout(payout.payoutId, accessToken);
        setToast({
          open: true,
          severity: "success",
          message: "Payout approved successfully",
        });
        refreshAll();
      } catch (err) {
        logger.error("Failed to approve payout", err);
        setToast({
          open: true,
          severity: "error",
          message: "Failed to approve payout",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [accessToken, refreshAll]
  );

  const handleReject = useCallback(async () => {
    if (!rejectTarget || !rejectReason.trim() || !accessToken) return;
    try {
      setActionLoading(true);
      await rejectAdminPayout(rejectTarget.payoutId, rejectReason.trim(), accessToken);
      setToast({
        open: true,
        severity: "success",
        message: "Payout rejected successfully",
      });
      setRejectModalOpen(false);
      setRejectReason("");
      setRejectTarget(null);
      refreshAll();
    } catch (err) {
      logger.error("Failed to reject payout", err);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to reject payout",
      });
    } finally {
      setActionLoading(false);
    }
  }, [rejectTarget, rejectReason, accessToken, refreshAll]);

  const handleRetry = useCallback(
    async (payout: AdminDriverPayoutListItem) => {
      if (!accessToken) return;
      const confirmed = window.confirm(`Retry payout of ${formatCurrency(payout.amount)} for ${payout.driverName}?`);
      if (!confirmed) return;
      try {
        setActionLoading(true);
        await retryAdminPayout(payout.payoutId, accessToken);
        setToast({
          open: true,
          severity: "success",
          message: "Payout retry initiated",
        });
        refreshAll();
      } catch (err) {
        logger.error("Failed to retry payout", err);
        setToast({
          open: true,
          severity: "error",
          message: "Failed to retry payout",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [accessToken, refreshAll]
  );

  const handleVerifyWallet = useCallback(
    async (driverProfileId: string, driverName: string) => {
      if (!accessToken) return;
      const confirmed = window.confirm(`Verify wallet for ${driverName}?`);
      if (!confirmed) return;
      try {
        setActionLoading(true);
        await verifyAdminWallet(driverProfileId, accessToken);
        setToast({
          open: true,
          severity: "success",
          message: "Wallet verified successfully",
        });
        refreshAll();
      } catch (err) {
        logger.error("Failed to verify wallet", err);
        setToast({
          open: true,
          severity: "error",
          message: "Failed to verify wallet",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [accessToken, refreshAll]
  );

  const summaryStatsItems = useMemo<readonly StatItem[]>(
    () => [
      {
        label: "Total Driver Earnings",
        value: summary ? formatCurrency(safeNum(summary.totalDriverEarnings)) : "—",
        subtitle: "Lifetime, completed trips",
        icon: <AttachMoneyIcon fontSize="medium" />,
        color: "success",
      },
      {
        label: "Platform Deduction",
        value: summary ? formatCurrency(safeNum(summary.totalPlatformDeduction)) : "—",
        subtitle: "Total commission earned",
        icon: <PaymentsOutlinedIcon fontSize="medium" />,
        color: "primary",
      },
      {
        label: "Pending Payouts",
        value: summary ? formatCurrency(safeNum(summary.totalPendingPayouts)) : "—",
        subtitle: `${summary?.pendingPayoutRequests ?? 0} request(s)`,
        icon: <AccountBalanceWalletOutlinedIcon fontSize="medium" />,
        color: "warning",
      },
      {
        label: "Active Drivers",
        value: summary ? String(summary.totalActiveDrivers) : "—",
        subtitle: `${summary?.pendingWalletVerifications ?? 0} wallet verification(s)`,
        icon: <PeopleOutlinedIcon fontSize="medium" />,
        color: "info",
      },
    ],
    [summary]
  );

  const openRejectModal = (payout: AdminDriverPayoutListItem) => {
    setRejectTarget(payout);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          gap: 2,
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
            }}
          >
            Driver Earnings
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Manage driver payouts, wallet verifications, and platform earnings overview
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={refreshAll} disabled={actionLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <VehicleStats items={summaryStatsItems} loading={summaryLoading} />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Pending Payout Requests
              </Typography>

              {payoutsLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 6,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : pendingPayouts.length === 0 ? (
                <Box
                  sx={{
                    py: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    textAlign: "center",
                  }}
                >
                  <PaymentsOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    No pending payout requests
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table>
                    <TableHead
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Driver</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Wallet Phone</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingPayouts.map(payout => {
                        const statusColor = getPayoutStatusColor(payout.status, theme);
                        return (
                          <TableRow
                            key={payout.payoutId}
                            hover
                            sx={{
                              "&:last-child td, &:last-child th": {
                                border: 0,
                              },
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                <Avatar
                                  sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    color: "primary.main",
                                    fontWeight: 700,
                                    width: 36,
                                    height: 36,
                                    fontSize: 14,
                                  }}
                                >
                                  {payout.driverName[0]}
                                </Avatar>
                                <Typography sx={{ fontWeight: 600 }} noWrap>
                                  {payout.driverName}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700 }}>{formatCurrency(payout.amount)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{payout.walletPhoneNumber ?? "—"}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={payout.status}
                                size="small"
                                sx={{
                                  textTransform: "capitalize",
                                  bgcolor: alpha(statusColor, 0.15),
                                  color: statusColor,
                                  fontWeight: 700,
                                  fontSize: 12,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{formatDate(payout.requestedAt, locale)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                                {payout.status.toLowerCase() === "pending" && (
                                  <>
                                    <Tooltip title="Approve">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        disabled={actionLoading}
                                        onClick={() => {
                                          void handleApprove(payout);
                                        }}
                                      >
                                        <CheckCircleIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        disabled={actionLoading}
                                        onClick={() => {
                                          openRejectModal(payout);
                                        }}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                                {payout.status.toLowerCase() === "failed" && (
                                  <Tooltip title="Retry">
                                    <IconButton
                                      size="small"
                                      color="warning"
                                      disabled={actionLoading}
                                      onClick={() => {
                                        void handleRetry(payout);
                                      }}
                                    >
                                      <RefreshIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mb: 2 }}>
                <VerifiedUserOutlinedIcon sx={{ color: "info.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Pending Wallet Verifications
                </Typography>
              </Stack>

              {verificationsLoading ? (
                <Stack spacing={2}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              ) : pendingVerifications.length === 0 ? (
                <Box
                  sx={{
                    py: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    textAlign: "center",
                  }}
                >
                  <VerifiedUserOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    No pending wallet verifications
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {pendingVerifications.map(item => (
                    <Paper
                      key={item.driverProfileId}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.12),
                              color: "info.main",
                              fontWeight: 700,
                              width: 36,
                              height: 36,
                              fontSize: 14,
                            }}
                          >
                            {item.driverName[0]}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 600 }}>
                              {item.driverName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                              {item.walletPhoneNumber ?? "No phone on file"}
                            </Typography>
                          </Box>
                        </Stack>
                        <Button
                          size="small"
                          variant="contained"
                          color="info"
                          disabled={actionLoading}
                          onClick={() => {
                            void handleVerifyWallet(item.driverProfileId, item.driverName);
                          }}
                        >
                          Verify
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Payout</DialogTitle>
        <DialogContent dividers>
          {rejectTarget && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Reject payout of {formatCurrency(rejectTarget.amount)} for {rejectTarget.driverName}?
            </Typography>
          )}
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
            error={rejectReason.trim() === "" && rejectReason.length > 0}
            helperText={rejectReason.trim() === "" && rejectReason.length > 0 ? "Reason is required" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectModalOpen(false);
            }}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleReject()}
            disabled={actionLoading || rejectReason.trim() === ""}
          >
            {actionLoading ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => {
          setToast(t => ({ ...t, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

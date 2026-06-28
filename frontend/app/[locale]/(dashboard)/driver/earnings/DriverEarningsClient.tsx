"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Grid, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { toApiUrl } from "@/utils/api-client";
import {
  getDriverEarningsStats,
  getDriverEarningsChart,
  getDriverTopBookings,
  getDriverEarningsHistory,
  getDriverPayouts,
  type DriverEarningsStats,
  type DriverMonthlyEarningPoint,
  type DriverTopBooking,
  type DriverEarningRow,
  type DriverPayout,
} from "@/api-clients/driver-earnings/driver-earnings";
import { logger } from "@/utils/logger";

import EarningsStatsRow from "./_components/EarningsStatsRow";
import MonthlyEarningsChart from "./_components/MonthlyEarningsChart";
import TopBookingsList from "./_components/TopBookingsList";
import EarningsHistoryTable from "./_components/EarningsHistoryTable";
import PayoutRequestModal from "./_components/PayoutRequestModal";
import PayoutHistory from "./_components/PayoutHistory";
import PayoutInfoPrompt from "./_components/PayoutInfoPrompt";

function safeNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export default function DriverEarningsClient() {
  const { data: session, status: sessionStatus } = useSession();
  const t = useTranslations("dashboard.driverEarnings");

  const currentYear = useMemo(() => new Date().getUTCFullYear(), []);
  const yearOptions = useMemo(() => [currentYear, currentYear - 1, currentYear - 2, currentYear - 3], [currentYear]);
  const [year, setYear] = useState<number>(currentYear);

  const [stats, setStats] = useState<DriverEarningsStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [chart, setChart] = useState<DriverMonthlyEarningPoint[] | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const [topBookings, setTopBookings] = useState<DriverTopBooking[] | null>(null);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  const [history, setHistory] = useState<DriverEarningRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [payouts, setPayouts] = useState<DriverPayout[] | null>(null);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  const [payoutInfo, setPayoutInfo] = useState<{
    walletPhoneNumber: string | null;
    payoutMethod: string;
    isVerified: boolean;
  } | null>(null);

  const [mounted, setMounted] = useState(false);

  const accessToken = session?.accessToken;

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading" || !accessToken) return;
    const abortState = { cancelled: false };
    void (async () => {
      try {
        const res = await fetch(toApiUrl("/api/driver/profile/payout-info"), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok && !abortState.cancelled) {
          const data = await res.json();
          setPayoutInfo(data);
        }
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setStatsLoading(false);
      setStatsError("You must be signed in to view earnings.");
      return;
    }

    const abortState = { cancelled: false };
    setStatsLoading(true);
    setStatsError(null);

    void (async () => {
      try {
        const data = await getDriverEarningsStats(accessToken);
        if (!abortState.cancelled) setStats(data);
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load driver earnings stats", err);
        setStatsError("Could not load your earnings stats. Please try again shortly.");
      } finally {
        if (!abortState.cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setTopLoading(false);
      setTopError("You must be signed in to view earnings.");
      return;
    }

    const abortState = { cancelled: false };
    setTopLoading(true);
    setTopError(null);

    void (async () => {
      try {
        const data = await getDriverTopBookings(accessToken);
        if (!abortState.cancelled) setTopBookings(data);
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load driver top bookings", err);
        setTopError("Could not load your top bookings. Please try again shortly.");
      } finally {
        if (!abortState.cancelled) setTopLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setChartLoading(false);
      setChartError("You must be signed in to view earnings.");
      return;
    }

    const abortState = { cancelled: false };
    setChartLoading(true);
    setChartError(null);

    void (async () => {
      try {
        const data = await getDriverEarningsChart(accessToken, year);
        if (!abortState.cancelled) setChart(data);
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load driver earnings chart", err);
        setChartError("Could not load the monthly chart. Please try again shortly.");
      } finally {
        if (!abortState.cancelled) setChartLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus, year]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setHistoryLoading(false);
      setHistoryError("You must be signed in to view earnings.");
      return;
    }

    const abortState = { cancelled: false };
    setHistoryLoading(true);
    setHistoryError(null);

    void (async () => {
      try {
        const data = await getDriverEarningsHistory(accessToken, page, 10);
        if (!abortState.cancelled) {
          setHistory(data);
          const hasMorePages = data.length >= 10;
          setTotalPages(hasMorePages ? page + 1 : page);
        }
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load driver earnings history", err);
        setHistoryError("Could not load your earnings history. Please try again shortly.");
      } finally {
        if (!abortState.cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus, page]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setPayoutsLoading(false);
      setPayoutsError("You must be signed in to view earnings.");
      return;
    }

    const abortState = { cancelled: false };
    setPayoutsLoading(true);
    setPayoutsError(null);

    void (async () => {
      try {
        const data = await getDriverPayouts(accessToken);
        if (!abortState.cancelled) setPayouts(data);
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load driver payouts", err);
        setPayoutsError("Could not load your payout history. Please try again shortly.");
      } finally {
        if (!abortState.cancelled) setPayoutsLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  const handleYearChange = useCallback((next: number) => {
    setYear(next);
  }, []);

  const handlePageChange = useCallback((next: number) => {
    setPage(next);
  }, []);

  const handlePayoutSuccess = useCallback(() => {
    if (accessToken) {
      void getDriverEarningsStats(accessToken)
        .then(setStats)
        .catch(() => {});
      void getDriverPayouts(accessToken)
        .then(setPayouts)
        .catch(() => {});
    }
  }, [accessToken]);

  const statLabels = useMemo(
    () => ({
      totalEarnings: t("totalEarnings"),
      thisMonth: t("thisMonth"),
      lastMonth: t("lastMonth"),
      availableBalance: t("availableBalance"),
    }),
    [t]
  );

  const chartLabels = useMemo(
    () => ({
      monthlyEarnings: t("monthlyEarnings"),
      noRevenueRecorded: t("noRevenueRecorded"),
      completedBookingsWillAppear: t("completedBookingsWillAppear"),
    }),
    [t]
  );

  const topBookingsLabels = useMemo(
    () => ({
      topBookings: t("topBookings"),
      noTopBookings: t("noTopBookings"),
      topBookingsWillAppear: t("topBookingsWillAppear"),
    }),
    [t]
  );

  const historyLabels = useMemo(
    () => ({
      date: t("date"),
      bookingId: t("bookingId"),
      grossEarning: t("grossEarning"),
      platformDeduction: t("platformDeduction"),
      netEarning: t("netEarning"),
      status: t("status"),
      page: t("page"),
      of: t("of"),
      available: t("available"),
      pendingPayoutStatus: t("pendingPayoutStatus"),
      paid: t("paid"),
      reversed: t("reversed"),
    }),
    [t]
  );

  const payoutModalLabels = useMemo(
    () => ({
      requestPayout: t("requestPayout"),
      availablePayoutBalance: t("availablePayoutBalance"),
      minimumPayout: t("minimumPayout"),
      amountToWithdraw: t("amountToWithdraw"),
      cancel: t("cancel"),
      confirm: t("confirm"),
      payoutRequested: t("payoutRequested"),
      amountExceedsBalance: t("amountExceedsBalance"),
      amountBelowMinimum: t("amountBelowMinimum"),
      payoutInfoNotVerified: t("payoutInfoNotVerified"),
      payoutInfoMissing: t("payoutInfoMissing"),
    }),
    [t]
  );

  const payoutInfoLabels = useMemo(
    () => ({
      payoutInfoMissing: t("payoutInfoMissing"),
      payoutInfoNotVerified: t("payoutInfoNotVerified"),
      completePayoutSetup: t("completePayoutSetup"),
      goToProfile: t("goToProfile"),
    }),
    [t]
  );

  const payoutHistoryLabels = useMemo(
    () => ({
      payoutHistory: t("payoutHistory"),
      noPayoutHistory: t("noPayoutHistory"),
      requested: t("requested"),
      approved: t("approved"),
      processing: t("processing"),
      completed: t("completed"),
      rejected: t("rejected"),
      failed: t("failed"),
    }),
    [t]
  );

  const availableBalance = stats ? safeNum(stats.availableBalance) : 0;
  const pendingPayoutAmount = stats ? safeNum(stats.pendingPayoutAmount) : 0;
  const isMissing = !payoutInfo || !payoutInfo.walletPhoneNumber;
  const isUnverified = payoutInfo?.walletPhoneNumber != null && !payoutInfo.isVerified;
  const showPayoutInfoPrompt = isMissing || isUnverified;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.4px" }}>
          {t("earningsOverview")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("trackYourIncome")}
        </Typography>
      </Box>

      {statsError && (
        <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
          {statsError}
        </Alert>
      )}

      <EarningsStatsRow stats={stats} loading={statsLoading} labels={statLabels} />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <MonthlyEarningsChart
            data={chart}
            loading={chartLoading}
            error={chartError}
            currentYear={currentYear}
            yearOptions={yearOptions}
            year={year}
            onYearChange={handleYearChange}
            mounted={mounted}
            labels={chartLabels}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <TopBookingsList bookings={topBookings} loading={topLoading} error={topError} labels={topBookingsLabels} />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <EarningsHistoryTable
          rows={history}
          loading={historyLoading}
          error={historyError}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          labels={historyLabels}
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          {showPayoutInfoPrompt && (
            <Box sx={{ mb: 2 }}>
              <PayoutInfoPrompt variant={isMissing ? "missing" : "unverified"} labels={payoutInfoLabels} />
            </Box>
          )}

          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 3 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <AccountBalanceWalletIcon sx={{ color: "primary.main" }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("payoutRequest")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Available: ${availableBalance.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                disabled={availableBalance <= 0}
                onClick={() => {
                  setPayoutModalOpen(true);
                }}
                sx={{ fontWeight: 700 }}
              >
                {t("requestPayout")}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <PayoutHistory payouts={payouts} loading={payoutsLoading} error={payoutsError} labels={payoutHistoryLabels} />
        </Grid>
      </Grid>

      {accessToken && (
        <PayoutRequestModal
          open={payoutModalOpen}
          onClose={() => {
            setPayoutModalOpen(false);
          }}
          onSuccess={handlePayoutSuccess}
          availableBalance={availableBalance}
          accessToken={accessToken}
          labels={payoutModalLabels}
        />
      )}
    </Box>
  );
}

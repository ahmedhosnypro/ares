"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  EventAvailable as EventAvailableIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { format, isSameMonth } from "date-fns";
import StatCard from "../../_components/StatCard";

interface DriverAssignment {
  bookingId: string;
  bookingNumber: string;
  pickupDate: string;
  returnDate: string;
  vehicleName: string;
  earnings: number;
  status: string;
}

export default function DriverEarningsClient() {
  const { data: session } = useSession();
  const theme = useTheme();
  const t = useTranslations("dashboard.driverEarnings");

  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await fetch(toApiUrl("/api/driver/assignments"), {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) throw new Error(t("errors.failedToLoadEarningsData"));

        const data = (await res.json()) as DriverAssignment[];
        setAssignments(data);
      } catch (err) {
        logger.error("Error fetching driver assignments for earnings", err);
        setError(t("couldNotLoadEarningsData"));
      } finally {
        setIsLoading(false);
      }
    };
    void fetchAssignments();
  }, [session, t]);

  const { totalEarnings, monthlyEarnings, completedTripEarnings, recentEarnings } = useMemo(() => {
    let total = 0;
    let monthly = 0;
    let completed = 0;
    const now = new Date();

    // Recent earnings sorted by most recent return date
    const completedAssignments = assignments
      .filter(a => a.status === "Completed")
      .sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());

    assignments.forEach(a => {
      // Total earnings typically refers to all completed, or anything they've been paid for.
      // We'll consider earnings for completed trips as guaranteed.
      if (a.status === "Completed") {
        total += a.earnings;
        completed += a.earnings;

        if (isSameMonth(new Date(a.returnDate), now)) {
          monthly += a.earnings;
        }
      }
    });

    return {
      totalEarnings: total,
      monthlyEarnings: monthly,
      completedTripEarnings: completed,
      recentEarnings: completedAssignments.slice(0, 10), // last 10 trips
    };
  }, [assignments]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
        {t("earningsOverview")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {t("trackYourIncome")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title={t("totalEarnings")}
            value={`$${totalEarnings.toFixed(2)}`}
            icon={<WalletIcon sx={{ color: "primary.main" }} />}
            trend={{ value: 0, label: t("lifetimeEarnings") }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title={t("thisMonth")}
            value={`$${monthlyEarnings.toFixed(2)}`}
            icon={<TrendingUpIcon sx={{ color: "success.main" }} />}
            trend={{ value: 0, label: format(new Date(), "MMMM yyyy") }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title={t("completedTrips")}
            value={`$${completedTripEarnings.toFixed(2)}`}
            icon={<EventAvailableIcon sx={{ color: "info.main" }} />}
            trend={{ value: 0, label: t("earningsFromFinishedTrips") }}
          />
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
        {t("recentEarningsHistory")}
      </Typography>

      {recentEarnings.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 4, textAlign: "center", border: `1px dashed ${theme.palette.divider}`, borderRadius: 2 }}
        >
          <Typography color="text.secondary">{t("noCompletedTrips")}</Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}
        >
          <Table sx={{ minWidth: 650 }} aria-label="earnings history table">
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("date")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("bookingId")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("vehicle")}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {t("earnings")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentEarnings.map(row => (
                <TableRow key={row.bookingId} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {format(new Date(row.returnDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{row.bookingNumber}</TableCell>
                  <TableCell>{row.vehicleName}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "success.main" }}>
                    +${row.earnings.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

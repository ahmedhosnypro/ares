"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Typography, Grid, TextField, Button, useTheme, CircularProgress } from "@mui/material";

import { logger } from "@/utils/logger";
import { apiFetchJson } from "@/utils/api-client";
import { FinancialReportsData } from "./types";

import { FinancialMetricCards } from "./FinancialMetricCards";
import { BookingSummaryTable } from "./BookingSummaryTable";
import { MonthlyRevenueChart } from "./MonthlyRevenueChart";
import { PaymentMethodsChart } from "./PaymentMethodsChart";
import { RecentPaymentsTable } from "./RecentPaymentsTable";
import { TopVehiclesTable } from "./TopVehiclesTable";
import { SupplierEarningsTable } from "./SupplierEarningsTable";
import { ReportGenerator } from "./ReportGenerator";

interface FinancialReportsClientProps {
  initialData: FinancialReportsData | null;
  accessToken: string;
  locale: string;
}

export default function FinancialReportsClient({
  initialData,
  accessToken,
  locale,
}: Readonly<FinancialReportsClientProps>) {
  const theme = useTheme();
  const isRtl = locale === "ar";
  const t = useTranslations("dashboardAdmin.financialReports");

  const [data, setData] = useState<FinancialReportsData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    data ? null : "Failed to load financial reports data. Please try again."
  );

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report Generation States
  const [incRevenue, setIncRevenue] = useState(true);
  const [incBookings, setIncBookings] = useState(true);
  const [incPayments, setIncPayments] = useState(true);
  const [incSuppliers, setIncSuppliers] = useState(true);

  const handleUpdateFilter = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", new Date(startDate).toISOString());
      if (endDate) queryParams.append("endDate", new Date(endDate).toISOString());

      const res = await apiFetchJson<FinancialReportsData>(
        `/api/dashboard/financial-reports?${queryParams.toString()}`,
        {
          method: "GET",
          accessToken,
        }
      );
      setData(res);
    } catch (err) {
      logger.error("Failed to fetch filtered financial report", err);
      setError("Failed to update financial reports. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchJson<FinancialReportsData>(`/api/dashboard/financial-reports`, {
        method: "GET",
        accessToken,
      });
      setData(res);
    } catch (err) {
      logger.error("Failed to retry fetching financial reports", err);
      setError("Failed to fetch financial reports. Please check your connection or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPrint = () => {
    if (!incRevenue && !incBookings && !incPayments && !incSuppliers) {
      return;
    }
    window.print();
  };

  if (!data) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          gap: 3,
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Typography color="error" variant="h6" sx={{ fontSize: "1rem" }}>
              {error || "No data available."}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                void handleRetry();
              }}
              sx={{ fontSize: "0.8rem", borderRadius: 1.5 }}
            >
              {t("updateFilter")}
            </Button>
          </>
        )}
      </Box>
    );
  }

  // Pre-calculate Donut Colors from theme
  const donutColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.status.active.main,
    theme.palette.status.confirmed.main,
  ];

  return (
    <Box dir={isRtl ? "rtl" : "ltr"} sx={{ pb: 4 }}>
      {/* Printable CSS Hook */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            width: 100%;
            direction: ${isRtl ? "rtl" : "ltr"};
          }
          .no-print {
            display: none !important;
          }
          .print-stack {
            width: 100% !important;
            max-width: 100% !important;
            flex-basis: 100% !important;
          }
        }
      `,
        }}
      />

      {/* Page Header */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}
        className="no-print"
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: "text.primary", mb: 0.5, fontSize: { xs: "1.45rem", sm: "1.65rem" } }}
          >
            {t("title")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
            {t("subtitle")}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
            bgcolor: "background.paper",
            p: 1,
            px: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.border.main}`,
          }}
        >
          <TextField
            type="date"
            label={t("dateFrom")}
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
            sx={{
              width: 140,
              "& .MuiOutlinedInput-root": {
                fontSize: "0.75rem",
                borderRadius: 1.5,
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.75rem",
              },
            }}
          />
          <TextField
            type="date"
            label={t("dateTo")}
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
            sx={{
              width: 140,
              "& .MuiOutlinedInput-root": {
                fontSize: "0.75rem",
                borderRadius: 1.5,
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.75rem",
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              void handleUpdateFilter();
            }}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 0.75,
              fontSize: "0.75rem",
              fontWeight: 700,
              boxShadow: theme.palette.shadow.button,
              "&:hover": {
                boxShadow: theme.palette.shadow.buttonHover,
              },
            }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : t("updateFilter")}
          </Button>
        </Box>
      </Box>

      {/* Main Print Container */}
      <Box id="print-area">
        {/* Metric Cards Grid */}
        <Box className={!incRevenue ? "no-print" : ""}>
          <FinancialMetricCards data={data} isRtl={isRtl} t={t} theme={theme} />
        </Box>

        {/* Middle Section: Booking Summary, Revenue Chart & Payment Methods */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Booking Summary Table */}
          <Grid size={{ xs: 12, lg: 4 }} className={`${!incBookings ? "no-print" : ""} print-stack`}>
            <BookingSummaryTable data={data} isRtl={isRtl} t={t} theme={theme} />
          </Grid>

          {/* Monthly Revenue Chart */}
          <Grid size={{ xs: 12, md: 6, lg: 5 }} className={`${!incRevenue ? "no-print" : ""} print-stack`}>
            <MonthlyRevenueChart data={data} isRtl={isRtl} t={t} theme={theme} />
          </Grid>

          {/* Payment Methods Chart */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }} className={`${!incPayments ? "no-print" : ""} print-stack`}>
            <PaymentMethodsChart data={data} isRtl={isRtl} t={t} theme={theme} donutColors={donutColors} />
          </Grid>
        </Grid>

        {/* Lower Section: Recent Payments & Top Vehicles */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Recent Payments */}
          <Grid size={{ xs: 12, lg: 7 }} className={`${!incPayments ? "no-print" : ""} print-stack`}>
            <RecentPaymentsTable data={data} isRtl={isRtl} t={t} theme={theme} locale={locale} />
          </Grid>

          {/* Top Revenue Vehicles */}
          <Grid size={{ xs: 12, lg: 5 }} className={`${!incRevenue ? "no-print" : ""} print-stack`}>
            <TopVehiclesTable data={data} isRtl={isRtl} t={t} theme={theme} />
          </Grid>
        </Grid>

        {/* Bottom Section: Supplier Earnings & Report Generator */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Supplier Earnings */}
          <Grid size={{ xs: 12, lg: 8 }} className={`${!incSuppliers ? "no-print" : ""} print-stack`}>
            <SupplierEarningsTable data={data} isRtl={isRtl} t={t} theme={theme} />
          </Grid>

          {/* Generate Custom Report Form */}
          <Grid size={{ xs: 12, lg: 4 }} className="no-print">
            <ReportGenerator
              t={t}
              theme={theme}
              incRevenue={incRevenue}
              setIncRevenue={setIncRevenue}
              incBookings={incBookings}
              setIncBookings={setIncBookings}
              incPayments={incPayments}
              setIncPayments={setIncPayments}
              incSuppliers={incSuppliers}
              setIncSuppliers={setIncSuppliers}
              handleExportPrint={handleExportPrint}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

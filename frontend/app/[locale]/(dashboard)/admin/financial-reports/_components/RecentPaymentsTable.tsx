import {
  Card,
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  alpha,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import { FinancialReportsData } from "./types";
import { getStatusColor, getMethodIcon } from "./utils";

interface RecentPaymentsTableProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
  locale: string;
}

export function RecentPaymentsTable({ data, isRtl, t, theme, locale }: Readonly<RecentPaymentsTableProps>) {
  return (
    <Card
      dir={isRtl ? "rtl" : "ltr"}
      sx={{
        boxShadow: theme.palette.shadow.card,
        borderRadius: 2,
        border: `1px solid ${theme.palette.border.light}`,
        textAlign: isRtl ? "right" : "left",
      }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }}>
          {t("recentPayments")}
        </Typography>
      </Box>
      <TableContainer sx={{ border: "none" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 2.5,
                  pr: 1.5,
                }}
              >
                {t("bookingNumber")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("customer")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("vehicle")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("amount")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("method")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("status")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 1.5,
                  pr: 2.5,
                }}
              >
                {t("date")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.recentPayments.map((row, i) => {
              const statusColors = getStatusColor(theme, row.status);
              return (
                <TableRow
                  key={`pay-${row.bookingNumber}-${i.toString()}`}
                  sx={{
                    transition: "all 0.2s ease",
                    "&:nth-of-type(even)": {
                      bgcolor: alpha(theme.palette.primary.main, 0.015),
                    },
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.035),
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      color: "primary.main",
                      fontSize: "0.75rem",
                      py: 1.25,
                      pl: 2.5,
                      pr: 1.5,
                    }}
                  >
                    {row.bookingNumber}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1.25, color: "text.primary" }}>
                    {row.customerName}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem", py: 1.25 }}>
                    {row.vehicleName}
                  </TableCell>
                  <TableCell
                    align={isRtl ? "left" : "right"}
                    sx={{ fontWeight: 800, fontSize: "0.75rem", py: 1.25, color: "text.primary" }}
                  >
                    EGP {row.amount.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      {getMethodIcon(theme, row.method)}
                      <Typography
                        sx={{
                          fontWeight: 700,
                          textTransform: "capitalize",
                          fontSize: "0.68rem",
                          color: "text.secondary",
                        }}
                      >
                        {row.method}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(statusColors.main, 0.1),
                        color: statusColors.main,
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        height: 20,
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem", py: 1.25, pl: 1.5, pr: 2.5 }}>
                    {new Date(row.date).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

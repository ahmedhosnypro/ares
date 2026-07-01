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
  alpha,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import { FinancialReportsData } from "./types";

interface SupplierEarningsTableProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

export function SupplierEarningsTable({ data, isRtl, t, theme }: Readonly<SupplierEarningsTableProps>) {
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
          {t("supplierEarnings")}
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
                {t("supplierName")}
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
                {t("totalVehicles")}
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
                {t("bookingsCount")}
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
                {t("commission")}
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
                  pl: 1.5,
                  pr: 2.5,
                }}
              >
                {t("netAmount")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.supplierEarnings.map(row => (
              <TableRow
                key={row.supplierName}
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
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    py: 1.25,
                    pl: 2.5,
                    pr: 1.5,
                    color: "text.primary",
                  }}
                >
                  {row.supplierName}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontSize: "0.75rem", py: 1.25, color: "text.secondary" }}
                >
                  {row.totalVehicles}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontSize: "0.75rem", py: 1.25, color: "text.secondary" }}
                >
                  {row.completedBookings}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1.25, color: "text.primary" }}
                >
                  EGP {row.revenue.toLocaleString()}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ color: "status.cancelled.main", fontSize: "0.75rem", py: 1.25, fontWeight: 600 }}
                >
                  EGP {row.commission.toLocaleString()}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{
                    fontWeight: 800,
                    color: "status.active.main",
                    fontSize: "0.75rem",
                    py: 1.25,
                    pl: 1.5,
                    pr: 2.5,
                  }}
                >
                  EGP {row.netAmount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

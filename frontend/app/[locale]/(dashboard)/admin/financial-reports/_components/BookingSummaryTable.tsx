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
import { getStatusColor } from "./utils";

interface BookingSummaryTableProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

export function BookingSummaryTable({ data, isRtl, t, theme }: Readonly<BookingSummaryTableProps>) {
  return (
    <Card
      dir={isRtl ? "rtl" : "ltr"}
      sx={{
        height: "100%",
        boxShadow: theme.palette.shadow.card,
        borderRadius: 2,
        border: `1px solid ${theme.palette.border.light}`,
        textAlign: isRtl ? "right" : "left",
      }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }}>
          {t("bookingSummary")}
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
                {t("status")}
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
                  pl: 1.5,
                  pr: 2.5,
                }}
              >
                {t("percentage")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.bookingSummary.map(row => {
              const statusColors = getStatusColor(theme, row.status);
              return (
                <TableRow
                  key={row.status}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    transition: "all 0.2s ease",
                    "&:nth-of-type(even)": {
                      bgcolor: alpha(theme.palette.primary.main, 0.015),
                    },
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.035),
                    },
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ py: 1, fontSize: "0.75rem", pl: 2.5, pr: 1.5 }}>
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
                  <TableCell
                    align={isRtl ? "left" : "right"}
                    sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1, color: "text.secondary" }}
                  >
                    {row.bookings}
                  </TableCell>
                  <TableCell
                    align={isRtl ? "left" : "right"}
                    sx={{ fontWeight: 800, fontSize: "0.75rem", py: 1, color: "text.primary" }}
                  >
                    EGP {row.amount.toLocaleString()}
                  </TableCell>
                  <TableCell
                    align={isRtl ? "left" : "right"}
                    sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1, pl: 1.5, pr: 2.5, color: "text.secondary" }}
                  >
                    {row.percentage}%
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

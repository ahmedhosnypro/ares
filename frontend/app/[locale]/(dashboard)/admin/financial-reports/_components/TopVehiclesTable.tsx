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
  Avatar,
  alpha,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import { FinancialReportsData } from "./types";

interface TopVehiclesTableProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

export function TopVehiclesTable({ data, isRtl, t, theme }: Readonly<TopVehiclesTableProps>) {
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
        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }}>{t("topVehicles")}</Typography>
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
                {t("rank")}
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
                  pl: 1.5,
                  pr: 2.5,
                }}
              >
                {t("amount")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.topVehicles.map(row => (
              <TableRow
                key={row.vehicleName}
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
                <TableCell sx={{ py: 1, pl: 2.5, pr: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      bgcolor: row.rank === 1 ? "secondary.main" : "background.default",
                      color: row.rank === 1 ? "secondary.contrastText" : "text.secondary",
                      border: `1px solid ${row.rank === 1 ? theme.palette.secondary.main : theme.palette.border.main}`,
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      borderRadius: 1,
                    }}
                  >
                    {row.rank}
                  </Avatar>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1, color: "text.primary" }}>
                  {row.vehicleName}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1, color: "text.secondary" }}
                >
                  {row.completedBookings}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.75rem", py: 1, pl: 1.5, pr: 2.5 }}
                >
                  EGP {row.revenue.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

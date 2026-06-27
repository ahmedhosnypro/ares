"use client";

import {
  Card,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";

interface HistoricalPayout {
  readonly tripId: string;
  readonly date: string;
  readonly clientName: string;
  readonly vehicleModel: string;
  readonly duration: string;
  readonly amount: string;
  readonly status: "Paid" | "Pending";
}

interface PayoutLogsTableProps {
  readonly payouts: readonly HistoricalPayout[];
}

export default function PayoutLogsTable({ payouts }: PayoutLogsTableProps) {
  const theme = useTheme();
  const t = useTranslations("dashboard.driverDashboard.payoutLogs");

  return (
    <Card
      sx={{
        borderRadius: 4,
        p: 3,
        border: "1px solid",
        borderColor: "border.light",
        bgcolor: "background.paper",
        boxShadow: theme.palette.shadow.card,
        overflow: "hidden",
        mb: 4,
      }}
    >
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {t("tripId")}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {t("dateCompleted")}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {t("client")}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {t("vehicle")}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {t("duration")}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {t("earnings")}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {t("payoutStatus")}
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payouts.map(row => (
              <TableRow
                key={row.tripId}
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>{row.tripId}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.clientName}</TableCell>
                <TableCell>{row.vehicleModel}</TableCell>
                <TableCell>{row.duration}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>{row.amount}</TableCell>
                <TableCell>
                  <Chip label={row.status} size="small" color="success" sx={{ fontWeight: 700, borderRadius: 2 }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

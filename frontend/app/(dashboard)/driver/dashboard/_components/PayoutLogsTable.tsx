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
                  Trip ID
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Date Completed
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Client
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Vehicle
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Duration
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Earnings
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Payout Status
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

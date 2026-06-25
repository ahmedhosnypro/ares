"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Avatar,
  alpha,
} from "@mui/material";

export interface BookingListItem {
  id: string;
  customer: string;
  customerAvatar?: string;
  car: string;
  date: string;
  status: string;
  amount: string;
}

export default function RecentBookingsTable({
  bookings,
}: Readonly<{
  readonly bookings: readonly BookingListItem[];
}>) {
  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        height: "100%",
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "700" }}>
            Recent Bookings
          </Typography>
          <Button
            component={Link}
            href="/admin/bookings"
            variant="text"
            size="small"
            sx={{
              fontWeight: 600,
              textTransform: "none",
              color: "primary.main",
              alignSelf: { xs: "flex-end", sm: "auto" },
            }}
          >
            View All
          </Button>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color: "text.secondary",
                    fontWeight: "600",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  Booking ID
                </TableCell>
                <TableCell
                  sx={{
                    color: "text.secondary",
                    fontWeight: "600",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  Customer
                </TableCell>
                <TableCell
                  sx={{
                    color: "text.secondary",
                    fontWeight: "600",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  Vehicle
                </TableCell>
                <TableCell
                  sx={{
                    color: "text.secondary",
                    fontWeight: "600",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  Date
                </TableCell>
                <TableCell
                  sx={{
                    color: "text.secondary",
                    fontWeight: "600",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  Amount
                </TableCell>
                <TableCell
                  sx={{
                    color: "text.secondary",
                    fontWeight: "600",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                    textAlign: "right",
                  }}
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map(row => (
                <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: "600" }}>
                    {row.id.length > 8 ? row.id.substring(0, 8).toUpperCase() : row.id}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        src={row.customerAvatar}
                        alt={row.customer}
                        sx={theme => ({
                          width: 32,
                          height: 32,
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        })}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.customer}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{row.car}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell sx={{ fontWeight: "700" }}>{row.amount}</TableCell>
                  <TableCell sx={{ textAlign: "right" }}>
                    <Chip
                      label={row.status}
                      size="small"
                      sx={theme => {
                        const status = row.status.toLowerCase();
                        const statusKey: "active" | "completed" | "pending" | "cancelled" | "confirmed" | "blocked" =
                          status === "active"
                            ? "active"
                            : status === "completed"
                              ? "completed"
                              : status === "pending" || status === "paymentpending"
                                ? "pending"
                                : status === "confirmed"
                                  ? "confirmed"
                                  : "cancelled";

                        const colorMain = theme.palette.status[statusKey].main;

                        return {
                          fontWeight: "700",
                          borderRadius: 2,
                          bgcolor: alpha(colorMain, 0.12),
                          color: colorMain,
                          "& .MuiChip-label": { px: 2 },
                        };
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

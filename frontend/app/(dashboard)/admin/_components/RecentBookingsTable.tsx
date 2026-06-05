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
                      <Avatar src={row.customerAvatar} sx={{ width: 32, height: 32 }} />
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
                        const statusKey: "active" | "completed" | "pending" | "cancelled" | "confirmed" | "blocked" =
                          row.status === "Active"
                            ? "active"
                            : row.status === "Completed"
                              ? "completed"
                              : row.status === "Pending"
                                ? "pending"
                                : "cancelled";

                        return {
                          fontWeight: "700",
                          borderRadius: 2,
                          bgcolor: theme.palette.status[statusKey].light,
                          color: theme.palette.status[statusKey].main,
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

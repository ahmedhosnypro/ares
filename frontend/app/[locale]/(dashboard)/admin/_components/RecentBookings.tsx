"use client";

import { Link } from "@/shared/i18n/routing";
import { toImageUrl } from "@/utils/image-url";
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
  IconButton,
  Tooltip,
} from "@mui/material";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import { useLocale } from "next-intl";
import { formatUtcDate } from "@/utils/dateTime";

export interface BookingListItem {
  readonly bookingId: string;
  readonly bookingNumber: string;
  readonly customerName: string;
  readonly vehicleName: string;
  readonly vehicleImage?: string | null;
  readonly bookingDate: string;
  readonly status: string;
}

interface RecentBookingsProps {
  readonly bookings?: readonly BookingListItem[];
}

export default function RecentBookings({ bookings = [] }: RecentBookingsProps) {
  const locale = useLocale();
  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        height: "100%",
        boxShadow: theme.palette.shadow.card,
        bgcolor: theme.palette.background.paper,
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
                  Booking Number
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
                    textAlign: "right",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: "2px solid",
                    borderColor: "divider",
                  }}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map(row => (
                <TableRow key={row.bookingId} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: "600" }}>{row.bookingNumber}</TableCell>
                  <TableCell sx={{ fontWeight: "500" }}>{row.customerName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        src={row.vehicleImage ? (toImageUrl(row.vehicleImage) as string) : undefined}
                        alt={row.vehicleName}
                        sx={theme => ({
                          width: 32,
                          height: 32,
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        })}
                      >
                        {!row.vehicleImage && row.vehicleName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.vehicleName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatUtcDate(row.bookingDate, locale)}</TableCell>
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
                  <TableCell sx={{ textAlign: "right" }}>
                    <Tooltip title="View Details">
                      <IconButton
                        component={Link}
                        href={`/admin/bookings/${row.bookingId}`}
                        size="small"
                        sx={{ color: "text.secondary" }}
                      >
                        <LaunchOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

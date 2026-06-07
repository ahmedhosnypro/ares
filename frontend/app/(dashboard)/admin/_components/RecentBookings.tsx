"use client";

import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  alpha,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const mockRecentBookings = [
  {
    id: "BKG-001",
    customer: "Ahmed Ali",
    car: "Mercedes S-Class",
    date: "Oct 24, 2026",
    status: "Active",
    amount: "$450",
  },
  { id: "BKG-002", customer: "Sara Mahmoud", car: "BMW X5", date: "Oct 23, 2026", status: "Completed", amount: "$320" },
  {
    id: "BKG-003",
    customer: "Omar Hassan",
    car: "Audi A6",
    date: "Oct 22, 2026",
    status: "PaymentPending",
    amount: "$280",
  },
  {
    id: "BKG-004",
    customer: "Nour Youssef",
    car: "Range Rover",
    date: "Oct 21, 2026",
    status: "Cancelled",
    amount: "$500",
  },
  {
    id: "BKG-005",
    customer: "Khaled Saed",
    car: "Porsche 911",
    date: "Oct 20, 2026",
    status: "Completed",
    amount: "$850",
  },
];

const getStatusColor = (status: string): "primary" | "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "Active":
      return "primary";
    case "Completed":
      return "success";
    case "Pending":
    case "PaymentPending":
      return "warning";
    case "Cancelled":
      return "error";
    default:
      return "default";
  }
};

export default function RecentBookings() {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "16px",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: theme => `0 4px 6px -1px ${alpha(theme.palette.common.black, 0.05)}`,
        height: "100%",
      }}
    >
      {" "}
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "800" }}>
            Recent Bookings
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ color: "text.secondary", fontWeight: "700", borderBottom: "2px solid", borderColor: "divider" }}
                >
                  Booking ID
                </TableCell>
                <TableCell
                  sx={{ color: "text.secondary", fontWeight: "700", borderBottom: "2px solid", borderColor: "divider" }}
                >
                  Customer
                </TableCell>
                <TableCell
                  sx={{ color: "text.secondary", fontWeight: "700", borderBottom: "2px solid", borderColor: "divider" }}
                >
                  Vehicle
                </TableCell>
                <TableCell
                  sx={{ color: "text.secondary", fontWeight: "700", borderBottom: "2px solid", borderColor: "divider" }}
                >
                  Date
                </TableCell>
                <TableCell
                  sx={{ color: "text.secondary", fontWeight: "700", borderBottom: "2px solid", borderColor: "divider" }}
                >
                  Amount
                </TableCell>
                <TableCell
                  sx={{
                    color: "text.secondary",
                    fontWeight: "700",
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
              {mockRecentBookings.map(row => (
                <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: "700" }}>{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: "500" }}>{row.customer}</TableCell>
                  <TableCell>{row.car}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell sx={{ fontWeight: "800" }}>{row.amount}</TableCell>
                  <TableCell sx={{ textAlign: "right" }}>
                    <Chip
                      label={row.status}
                      color={getStatusColor(row.status)}
                      size="small"
                      variant="filled"
                      sx={{ fontWeight: "700", borderRadius: 2 }}
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

"use client";

import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  useTheme,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

interface Booking {
  id: string;
  customer: string;
  car: string;
  date: string;
  status: "Active" | "Completed" | "Pending" | "Cancelled";
  amount: number;
}

export default function RecentBookingsTable({ bookings }: { bookings: Booking[] }) {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "primary";
      case "Completed": return "success";
      case "Pending": return "warning";
      case "Cancelled": return "error";
      default: return "default";
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" fontWeight="700">Recent Bookings</Typography>
          <IconButton size="small"><MoreVertIcon /></IconButton>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "600", borderBottom: "2px solid", borderColor: "divider" }}>Booking ID</TableCell>
                <TableCell sx={{ fontWeight: "600", borderBottom: "2px solid", borderColor: "divider" }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: "600", borderBottom: "2px solid", borderColor: "divider" }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: "600", borderBottom: "2px solid", borderColor: "divider" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: "600", borderBottom: "2px solid", borderColor: "divider" }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: "600", borderBottom: "2px solid", borderColor: "divider" }} align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((row) => (
                <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: "600" }}>{row.id}</TableCell>
                  <TableCell>{row.customer}</TableCell>
                  <TableCell>{row.car}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "700" }}>${row.amount}</TableCell>
                  <TableCell align="right">
                    <Chip label={row.status} color={getStatusColor(row.status) as any} size="small" sx={{ fontWeight: 600, borderRadius: 2 }} />
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
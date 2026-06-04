"use client";

import { Card, CardContent, Typography, List, ListItem, ListItemText, Chip, Box, useTheme } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function UpcomingBookings({ bookings }: { bookings: any[] }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        height: "100%",
        mb: 3 ,
        mt: 3,
        p:2,
        
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="700" gutterBottom>Upcoming Bookings</Typography>
        <List>
          {bookings.map((booking) => (
            <ListItem key={booking.id} divider sx={{ px: 0 }}>
              <ListItemText
                primary={booking.customer}
                secondary={
                  <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="caption">{booking.pickupDate} → {booking.returnDate}</Typography>
                  </Box>
                }
              />
              <Chip label={booking.car} size="small" variant="outlined" />
            </ListItem>
          ))}
          {bookings.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>No upcoming bookings.</Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
}
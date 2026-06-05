import Link from "next/link";
import { Card, CardContent, Typography, Box, Stack, Button } from "@mui/material";
import { TopVehicle } from "./mockData";

export default function TopVehicles({ vehicles }: Readonly<{ readonly vehicles: readonly TopVehicle[] }>) {
  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        boxShadow: theme.palette.shadow.card,
        height: "100%",
      })}
    >
      <CardContent sx={{ p: 3 }}>
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Top Vehicles by Bookings
          </Typography>
          <Button
            component={Link}
            href="/admin/vehicles"
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
        <Stack spacing={3}>
          {vehicles.map(vehicle => {
            const isUp = vehicle.trendPercentage > 0;
            const trendColor = isUp ? "success.main" : "error.main";
            const trendIcon = isUp ? "↑" : "↓";

            return (
              <Box key={vehicle.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  component="img"
                  src={vehicle.imageUrl}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  sx={theme => ({
                    width: 80,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: theme.palette.border.light,
                    boxShadow: theme.palette.shadow.card,
                  })}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {vehicle.make} {vehicle.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vehicle.bookingsCount} bookings
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: trendColor }}>
                  {trendIcon} {Math.abs(vehicle.trendPercentage)}%
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

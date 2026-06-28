import { Link } from "@/shared/i18n/routing";
import Image from "next/image";
import { Card, CardContent, Typography, Box, Stack, Button } from "@mui/material";
import { DirectionsCarFilledTwoTone as CarIcon } from "@mui/icons-material";
import { TopVehicle } from "./mockData";
import { toImageUrl } from "@/utils/image-url";

export default function TopVehicles({ vehicles }: Readonly<{ readonly vehicles: readonly TopVehicle[] }>) {
  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
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
            }}
          >
            View All
          </Button>
        </Box>
        <Stack spacing={1}>
          {vehicles.map(vehicle => {
            const trendPercentage = vehicle.trendPercentage ?? 0;
            const isUp = trendPercentage > 0;
            const trendColor = isUp ? "success.main" : "error.main";
            const trendIcon = isUp ? "↑" : "↓";

            return (
              <Box
                key={vehicle.id}
                component={Link}
                href={`/admin/vehicles/${vehicle.id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  textDecoration: "none",
                  color: "inherit",
                  p: 1,
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box
                  sx={theme => ({
                    width: 64,
                    height: 48,
                    borderRadius: 1.5,
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "1px solid",
                    borderColor: theme.palette.border.light,
                    boxShadow: theme.palette.shadow.card,
                    bgcolor: theme.palette.action.hover,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  {vehicle.imageUrl ? (
                    <Image
                      src={toImageUrl(vehicle.imageUrl) as string}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      width={64}
                      height={48}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <CarIcon fontSize="small" />
                  )}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {vehicle.make} {vehicle.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {vehicle.bookingsCount} bookings
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: trendColor, flexShrink: 0 }}>
                  {trendIcon} {Math.abs(trendPercentage)}%
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

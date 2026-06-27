"use client";

import { Box, Grid, Card, CardContent, Stack, Avatar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import {
  AttachMoney as EarningsIcon,
  AssignmentTurnedIn as VerifiedIcon,
  AccessTime as ActiveTripsIcon,
  Star as StarIcon,
} from "@mui/icons-material";

interface KpiMetricsGridProps {
  readonly earnings: string;
  readonly tripsCompleted: number;
  readonly activeUpcomingCount: number;
  readonly rating: string;
}

export default function KpiMetricsGrid({ earnings, tripsCompleted, activeUpcomingCount, rating }: KpiMetricsGridProps) {
  const t = useTranslations("dashboard.driverDashboard.kpiMetrics");

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", mb: 2 }}
      >
        {t("overviewMetrics")}
      </Typography>
      <Grid container spacing={3}>
        {/* Earnings Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "border.light",
              bgcolor: "background.paper",
              boxShadow: theme => theme.palette.shadow.card,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    {t("earnings")}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mt: 0.5 }}>
                    {earnings}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "icon.phone.bg", color: "icon.phone.color", width: 42, height: 42 }}>
                  <EarningsIcon fontSize="medium" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Trips Completed Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "border.light",
              bgcolor: "background.paper",
              boxShadow: theme => theme.palette.shadow.card,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    {t("tripsDone")}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mt: 0.5 }}>
                    {tripsCompleted}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "icon.email.bg", color: "icon.email.color", width: 42, height: 42 }}>
                  <VerifiedIcon fontSize="medium" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Active/Upcoming Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "border.light",
              bgcolor: "background.paper",
              boxShadow: theme => theme.palette.shadow.card,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    {t("scheduled")}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mt: 0.5 }}>
                    {activeUpcomingCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "icon.business.bg", color: "icon.business.color", width: 42, height: 42 }}>
                  <ActiveTripsIcon fontSize="medium" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Rating Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "border.light",
              bgcolor: "background.paper",
              boxShadow: theme => theme.palette.shadow.card,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    {t("rating")}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mt: 0.5 }}>
                    {rating}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "action.hover", color: "warning.main", width: 42, height: 42 }}>
                  <StarIcon fontSize="medium" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

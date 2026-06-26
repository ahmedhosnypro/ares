import { Link } from "@/shared/i18n/routing";
import { Card, CardContent, Typography, Box, Stack, Avatar, Button, alpha } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { DashboardAlert } from "./mockData";

export default function AlertsCenter({ alerts }: { readonly alerts: readonly DashboardAlert[] }) {
  const getStatusKey = (type: string): "active" | "completed" | "pending" | "cancelled" | "confirmed" | "blocked" => {
    switch (type) {
      case "error":
        return "cancelled";
      case "warning":
        return "pending";
      case "success":
        return "completed";
      case "info":
      default:
        return "active";
    }
  };

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
            Alerts Center
          </Typography>
          <Button
            component={Link}
            href="/admin/alerts"
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
          {alerts.map(alert => {
            const statusKey = getStatusKey(alert.type);
            return (
              <Box key={alert.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={theme => {
                    const colorMain = theme.palette.status[statusKey].main;
                    return {
                      bgcolor: alpha(colorMain, 0.12),
                      color: colorMain,
                      width: 40,
                      height: 40,
                    };
                  }}
                >
                  <NotificationsIcon fontSize="small" />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.timestamp}
                  </Typography>
                </Box>
                <ChevronRightIcon color="action" />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

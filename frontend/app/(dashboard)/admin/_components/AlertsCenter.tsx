import Link from "next/link";
import { Card, CardContent, Typography, Box, Stack, Avatar, Button, Palette } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { DashboardAlert } from "./mockData";

export default function AlertsCenter({ alerts }: { readonly alerts: readonly DashboardAlert[] }) {
  const getColorKey = (type: string): keyof Pick<Palette, "error" | "warning" | "success" | "info"> => {
    switch (type) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "success":
        return "success";
      case "info":
      default:
        return "info";
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
            const colorKey = getColorKey(alert.type);
            return (
              <Box key={alert.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={theme => {
                    const color = theme.palette[colorKey];
                    return {
                      bgcolor: color.light,
                      color: color.main,
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

import React from "react";
import Link from "next/link";
import { Card, CardContent, Typography, Box, Stack, Avatar, Button } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { DashboardActivity } from "./mockData";

export default function LiveActivity({ activities }: { activities: DashboardActivity[] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "booking": return <DirectionsCarIcon fontSize="small" />;
      case "registration": return <PersonAddIcon fontSize="small" />;
      case "inspection": return <AssignmentTurnedInIcon fontSize="small" />;
      case "refund": return <AttachMoneyIcon fontSize="small" />;
      default: return <DirectionsCarIcon fontSize="small" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "booking": return "primary";
      case "registration": return "success";
      case "inspection": return "warning";
      case "refund": return "error";
      default: return "primary";
    }
  };

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        boxShadow: theme.palette.shadow.card,
        height: "100%",
      })}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 2, sm: 0 }, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Live Activity
          </Typography>
          <Button
            component={Link}
            href="/admin/activity"
            variant="text"
            size="small"
            sx={{ fontWeight: 600, textTransform: "none", color: "primary.main", alignSelf: { xs: "flex-end", sm: "auto" } }}
          >
            View All
          </Button>
        </Box>
        <Stack spacing={3}>
          {activities.map((activity) => {
            const colorKey = getActivityColor(activity.type);
            return (
              <Box key={activity.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={(theme) => ({
                    bgcolor: (theme.palette as any)[colorKey].light,
                    color: (theme.palette as any)[colorKey].main,
                    width: 40,
                    height: 40,
                  })}
                >
                  {getActivityIcon(activity.type)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {activity.description}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                  {activity.timeAgo}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, Typography, Box, LinearProgress, IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

export default function SystemStatusCard() {
  const systemMetrics = [
    { label: "Server CPU Load", value: "32%", amount: 32, color: "primary" },
    { label: "Memory Usage", value: "68%", amount: 68, color: "warning" },
    { label: "Storage Capacity", value: "45%", amount: 45, color: "success" },
  ];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "border.main",
        height: "100%",
        mt: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            System Status
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 2 }}>
          {systemMetrics.map((item, i) => (
            <Box key={i}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }} color={`${item.color}.main`}>
                  {item.value}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.amount}
                color={item.color as "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "action.hover",
                }}
              />
            </Box>
          ))}

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 3,
              bgcolor: "success.lighter",
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <TaskAltIcon color="success" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }} color="success.main">
                All Systems Operational
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                No incidents reported in the last 24 hours.
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

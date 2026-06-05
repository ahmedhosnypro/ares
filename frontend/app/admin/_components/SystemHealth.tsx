"use client";

import { Card, CardContent, Typography, Box, IconButton, LinearProgress } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

export default function SystemHealth() {
  return (
    <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            System Status
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {[
            { label: "Server CPU Load", value: "32%", amount: 32, color: "primary" },
            { label: "Memory Usage", value: "68%", amount: 68, color: "warning" },
            { label: "Storage Capacity", value: "45%", amount: 45, color: "success" },
          ].map((item, i) => (
            <Box key={i}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }} color={`${item.color}.main`}>
                  {item.value}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.amount}
                color={item.color as "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                sx={{ height: 8, borderRadius: 4, bgcolor: "border.light" }}
              />
            </Box>
          ))}

          <Box
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 3,
              bgcolor: "success.lighter",
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              border: "1px solid",
              borderColor: "success.light",
            }}
          >
            <TaskAltIcon color="success" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }} color="success.dark">
                All Systems Operational
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 0.5, fontWeight: 500 }}>
                No incidents reported in the last 24 hours.
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

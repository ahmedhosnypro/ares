"use client";

import { Card, CardContent, Typography, Box, Badge, LinearProgress, Avatar } from "@mui/material";
import SettingsInputAntennaIcon from "@mui/icons-material/SettingsInputAntenna";
import PhonelinkRingIcon from "@mui/icons-material/PhonelinkRing";

export default function LiveTrackingWidget() {
  // Mock data for currently connected mobile devices
  const totalActiveRentals = 45;
  const connectedPhones = 42;
  const connectionHealth = (connectedPhones / totalActiveRentals) * 100;

  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Live Mobile Tracking
          </Typography>
          <Badge
            color="success"
            variant="dot"
            sx={{
              "& .MuiBadge-badge": { width: 10, height: 10, borderRadius: "50%", animation: "pulse 1.5s infinite" },
            }}
          >
            <SettingsInputAntennaIcon color="action" />
          </Badge>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: "primary.light", color: "primary.main", width: 56, height: 56 }}>
            <PhonelinkRingIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {connectedPhones} / {totalActiveRentals}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Active Phones Connected
            </Typography>
          </Box>
        </Box>

        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: "bold" }}>
              WebSocket Health
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: "bold" }} color="success.main">
              {Math.round(connectionHealth)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={connectionHealth}
            color="success"
            sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover" }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

// app/admin/components/StatCard.tsx
"use client";

import { Card, CardContent, Box, Avatar, Typography, Chip, useTheme } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

const iconMap = {
  EventAvailable: EventAvailableIcon,
  DirectionsCar: DirectionsCarIcon,
  AttachMoney: AttachMoneyIcon,
  PeopleAlt: PeopleAltIcon,
};

export default function StatCard({ title, value, change, isUp, icon, color }: any) {
  const theme = useTheme();
  const IconComponent = iconMap[icon as keyof typeof iconMap];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        bgcolor: "background.paper",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: theme.palette.mode === "light" ? "0 4px 20px rgba(0,0,0,0.03)" : "none",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: theme.palette.mode === "light" ? "0 12px 28px rgba(0,0,0,0.08)" : "0 12px 28px rgba(0,0,0,0.4)",
        },
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              color: "#fff",
              width: 52,
              height: 52,
              boxShadow: `0 8px 16px ${(theme.palette as any)[color].main}40`,
            }}
          >
            <IconComponent fontSize="medium" />
          </Avatar>
          <Chip
            icon={isUp ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
            label={change}
            size="small"
            color={isUp ? "success" : "error"}
            variant="outlined"
            sx={{ fontWeight: "bold", borderRadius: 2 }}
          />
        </Box>
        <Typography variant="h3" fontWeight="800" sx={{ mb: 1, letterSpacing: "-1px" }}>
          {value}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight="600"
          sx={{ textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.75rem" }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}
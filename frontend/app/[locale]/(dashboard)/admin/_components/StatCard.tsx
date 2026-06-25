// app/admin/components/StatCard.tsx
"use client";

import { Card, CardContent, Box, Avatar, Typography, Chip, useTheme, alpha } from "@mui/material";
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

type StatColor = "primary" | "secondary" | "error" | "warning" | "info" | "success";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isUp: boolean;
  icon: keyof typeof iconMap;
  color: StatColor;
}

export default function StatCard({ title, value, change, isUp, icon, color }: Readonly<StatCardProps>) {
  const theme = useTheme();
  const IconComponent = iconMap[icon];

  const paletteColor = theme.palette[color] as { main: string; contrastText: string };
  const mainColor = paletteColor.main;
  const contrastText = paletteColor.contrastText;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: theme =>
          theme.palette.mode === "light" ? `0 4px 20px ${alpha(theme.palette.common.black, 0.03)}` : "none",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: theme =>
            theme.palette.mode === "light"
              ? `0 12px 28px ${alpha(theme.palette.common.black, 0.08)}`
              : `0 12px 28px ${alpha(theme.palette.common.black, 0.4)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              color: contrastText,
              width: 52,
              height: 52,
              boxShadow: `0 8px 16px ${alpha(mainColor, 0.25)}`,
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
        <Typography variant="h3" sx={{ fontWeight: "800", mb: 1, letterSpacing: "-1px", color: "text.primary" }}>
          {value}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.75rem" }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}

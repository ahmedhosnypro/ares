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

interface StatCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly change: string;
  readonly isUp: boolean;
  readonly icon: keyof typeof iconMap;
  readonly color: "primary" | "secondary" | "success" | "warning" | "error" | "info";
}

export default function StatCard({ title, value, change, isUp, icon, color }: StatCardProps) {
  const theme = useTheme();
  const IconComponent = iconMap[icon];

  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: theme.palette.shadow.card,
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: theme.palette.shadow.cardHover,
        },
      })}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              color: "common.white",
              width: 52,
              height: 52,
              boxShadow: theme.palette.shadow.button,
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
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-1px" }}>
          {value}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.75rem" }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}

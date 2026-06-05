import React from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import BadgeIcon from "@mui/icons-material/Badge";

export interface SummaryItem {
  title: string;
  value: string;
  change: string;
  isUp: boolean;
  color: "primary" | "success" | "warning" | "error" | "info" | "secondary";
  iconName: "Storefront" | "DirectionsCar" | "AttachMoney" | "PeopleAlt" | "EventAvailable" | "GppMaybe" | "PersonOutline" | "BuildCircle" | "Badge";
}

const IconMap = {
  Storefront: StorefrontIcon,
  DirectionsCar: DirectionsCarIcon,
  AttachMoney: AttachMoneyIcon,
  PeopleAlt: PeopleAltIcon,
  EventAvailable: EventAvailableIcon,
  GppMaybe: GppMaybeIcon,
  PersonOutline: PersonOutlinedIcon,
  BuildCircle: BuildCircleIcon,
  Badge: BadgeIcon,
};

export default function StatCardGrid({ items }: { items: SummaryItem[] }) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {items.map((stat, i) => {
        const Icon = IconMap[stat.iconName];
        
        // Map the basic color to the status theme colors to avoid hardcoding
        const statusKey = 
          stat.color === "primary" ? "active" : 
          stat.color === "success" ? "completed" : 
          stat.color === "warning" ? "pending" : 
          stat.color === "error" ? "cancelled" :
          stat.color === "info" ? "active" : "pending";

        return (
          <Grid size={{ xs: 6, sm: 4, lg: 2 }} key={i}>
            <Card
              elevation={0}
              sx={(theme) => ({
                borderRadius: 2,
                border: "1px solid",
                borderColor: theme.palette.border.main,
                boxShadow: theme.palette.shadow.card,
                height: "100%",
                transition: "box-shadow 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: theme.palette.shadow.cardHover,
                }
              })}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={(theme) => ({
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 2,
                      bgcolor: theme.palette.status[statusKey].light,
                      color: theme.palette.status[statusKey].main,
                    })}
                  >
                    <Icon />
                  </Box>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={(theme) => ({ 
                    fontWeight: 600, 
                    color: stat.isUp ? theme.palette.status.active.main : theme.palette.status.cancelled.main 
                  })}
                >
                  {stat.change}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  vs last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

import React from "react";
import { Card, CardContent, Typography, Box, Button, Grid } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { QuickAction } from "./mockData";
import Link from "next/link";

const IconMap = {
  Car: DirectionsCarIcon,
  Shield: VerifiedUserIcon,
  Store: StorefrontIcon,
  FileText: AssessmentIcon,
};

export default function QuickActions({ actions }: { actions: QuickAction[] }) {
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
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2} >
          {actions.map((action, i) => {
            const Icon = IconMap[action.icon as keyof typeof IconMap];
            return (
              <Grid size={{ xs: 6, sm: 6 }} key={i}>
                <Button
                  variant="contained"
                  component={Link}
                  href={action.path}
                  disableElevation
                  sx={(theme) => ({
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    height: "100%",
                    width: "100%",
                    borderRadius: 3,
                    textTransform: "none",
                    bgcolor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    border: "1px solid transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: theme.palette.background.paper,
                      boxShadow: theme.palette.shadow.cardHover,
                      borderColor: theme.palette.border.main,
                      transform: "translateY(-2px)"
                    }
                  })}
                >
                  <Box
                    sx={(theme) => {
                      const statusKey = 
                        action.color === "primary" ? "active" : 
                        action.color === "success" ? "completed" : 
                        action.color === "warning" ? "pending" : 
                        action.color === "error" ? "cancelled" :
                        action.color === "info" ? "active" : "pending";
                        
                      return {
                        bgcolor: theme.palette.status[statusKey].light,
                        color: theme.palette.status[statusKey].main,
                        p: 1.5,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1
                      };
                    }}
                  >
                    <Icon fontSize="medium" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
                    {action.label}
                  </Typography>
                </Button>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}

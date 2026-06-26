import { Card, CardContent, Typography, Box, Button, Grid, alpha } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { QuickAction } from "./mockData";
import { Link } from "@/shared/i18n/routing";
const IconMap = {
  Car: DirectionsCarIcon,
  Shield: VerifiedUserIcon,
  Store: StorefrontIcon,
  FileText: AssessmentIcon,
  AssignmentInd: AssignmentIndIcon,
  FactCheck: FactCheckIcon,
};

type StatusKey = "active" | "completed" | "pending" | "cancelled" | "confirmed" | "blocked";

const getStatusKey = (color: string): StatusKey => {
  if (color === "primary") return "active";
  if (color === "success") return "completed";
  if (color === "warning") return "pending";
  if (color === "error") return "cancelled";
  if (color === "info") return "active";
  return "pending";
};

export default function QuickActions({ actions }: Readonly<{ actions: readonly QuickAction[] }>) {
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
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {actions.map((action, i) => {
            const Icon = IconMap[action.icon as keyof typeof IconMap];
            const statusKey = getStatusKey(action.color);

            return (
              <Grid size={{ xs: 6, sm: 6 }} key={i}>
                <Button
                  variant="contained"
                  component={Link}
                  href={action.path}
                  disableElevation
                  sx={theme => {
                    const colorMain = theme.palette.status[statusKey].main;
                    return {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                      height: "100%",
                      width: "100%",
                      borderRadius: 2,
                      textTransform: "none",
                      bgcolor: alpha(colorMain, 0.04),
                      color: theme.palette.text.primary,
                      border: "1px solid",
                      borderColor: alpha(colorMain, 0.1),
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: alpha(colorMain, 0.08),
                        boxShadow: `0 4px 12px ${alpha(colorMain, 0.12)}`,
                        borderColor: alpha(colorMain, 0.2),
                        transform: "translateY(-2px)",
                      },
                    };
                  }}
                >
                  <Box
                    sx={theme => {
                      const colorMain = theme.palette.status[statusKey].main;
                      return {
                        bgcolor: alpha(colorMain, 0.12),
                        color: colorMain,
                        p: 1.5,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1.5,
                        boxShadow: `0 4px 10px ${alpha(colorMain, 0.2)}`,
                      };
                    }}
                  >
                    <Icon fontSize="medium" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
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

import { Card, CardContent, Typography, Box, Grid, alpha, useTheme, type Theme } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { QuickAction } from "./mockData";
import { Link } from "@/shared/i18n/routing";

const IconMap = {
  Car: DirectionsCarIcon,
  Shield: VerifiedUserIcon,
  AssignmentInd: AssignmentIndIcon,
  PersonAdd: PersonAddIcon,
  AddBox: AddBoxIcon,
};

const getActionColor = (theme: Theme, label: string) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("create booking")) return theme.palette.status.active.main;
  if (lowerLabel.includes("add user")) return theme.palette.status.confirmed.main;
  if (lowerLabel.includes("add vehicle")) return theme.palette.status.completed.main;
  if (lowerLabel.includes("review")) return theme.palette.warning.main;
  if (lowerLabel.includes("assign")) return theme.palette.status.pending.main;
  return theme.palette.primary.main;
};

export default function QuickActions({ actions }: Readonly<{ actions: readonly QuickAction[] }>) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "border.main",
        boxShadow: "shadow.card",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: "1.1rem" }}>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5}>
          {actions.map((action, i) => {
            const Icon = (IconMap as Record<string, typeof AddBoxIcon>)[action.icon] ?? AddBoxIcon;
            const colorMain = getActionColor(theme, action.label);

            return (
              <Grid size={{ xs: 12, sm: 6 }} key={i}>
                <Box
                  component={Link}
                  href={action.path}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1.5,
                    borderRadius: 2,
                    textDecoration: "none",
                    bgcolor: "background.paper",
                    color: "text.primary",
                    border: "1px solid",
                    borderColor: "border.light",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "all 0.2s ease-in-out",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: alpha(colorMain, 0.04),
                      borderColor: alpha(colorMain, 0.3),
                      boxShadow: `0 4px 12px ${alpha(colorMain, 0.15)}`,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: alpha(colorMain, 0.12),
                      color: colorMain,
                      minWidth: 40,
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 1.5,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      lineHeight: 1.2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {action.label}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}

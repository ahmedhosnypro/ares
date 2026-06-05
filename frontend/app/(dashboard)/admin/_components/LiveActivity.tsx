import Link from "next/link";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { RecentSummaryItem } from "../types";

export default function LiveActivity({ activities }: { readonly activities: readonly RecentSummaryItem[] }) {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "booking":
        return <DirectionsCarIcon fontSize="small" />;
      case "registration":
        return <PersonAddIcon fontSize="small" />;
      case "inspection":
        return <AssignmentTurnedInIcon fontSize="small" />;
      case "payment":
      case "refund":
        return <AttachMoneyIcon fontSize="small" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  const getActivityColor = (type: string): "primary" | "success" | "warning" | "error" | "info" => {
    switch (type.toLowerCase()) {
      case "booking":
        return "primary";
      case "registration":
        return "success";
      case "inspection":
        return "warning";
      case "payment":
      case "refund":
        return "error";
      default:
        return "info";
    }
  };

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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Recent Activity
          </Typography>
          <Button
            component={Link}
            href="/admin/activity"
            variant="text"
            size="small"
            sx={{
              fontWeight: 600,
              textTransform: "none",
              color: "primary.main",
              alignSelf: { xs: "flex-end", sm: "auto" },
            }}
          >
            View All
          </Button>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 400 }} aria-label="recent activity table">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ color: "text.secondary", fontWeight: 600, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  Activity
                </TableCell>
                <TableCell
                  sx={{ color: "text.secondary", fontWeight: 600, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  Time
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.length > 0 ? (
                activities.map((activity, index) => {
                  const colorKey = getActivityColor(activity.type);
                  return (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 }, "&:hover": { bgcolor: "action.hover" } }}
                    >
                      <TableCell sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            sx={theme => {
                              const color = theme.palette[colorKey];
                              return {
                                bgcolor: color.light,
                                color: color.main,
                                width: 32,
                                height: 32,
                              };
                            }}
                          >
                            {getActivityIcon(activity.type)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activity.message}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                          {new Date(activity.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 3, border: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                      No recent activities available.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

// app/admin/components/ActivityFeed.tsx
"use client";

import { Card, CardContent, Typography, List, ListItem, ListItemText, ListItemIcon, Avatar, Box } from "@mui/material";
import { AccessTime, EventNote, Person, DirectionsCar, Payment } from "@mui/icons-material";

const getActivityIcon = (type: string) => {
  switch (type) {
    case "booking":
      return <EventNote />;
    case "user":
      return <Person />;
    case "vehicle":
      return <DirectionsCar />;
    case "payment":
      return <Payment />;
    default:
      return <AccessTime />;
  }
};

interface Activity {
  id: string | number;
  type: string;
  action: string;
  user: string;
  timestamp: string | Date;
}

export default function ActivityFeed({ activities }: Readonly<{ activities: readonly Activity[] }>) {
  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 4,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        height: "100%",
        p: 2,
        mt: 3,
        mb: 3,
      })}
    >
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
          Recent Activity
        </Typography>
        <List sx={{ maxHeight: 400, overflow: "auto" }}>
          {activities.map(activity => (
            <ListItem key={activity.id} divider>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: "primary.light", color: "primary.main" }}>
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={activity.action}
                secondary={
                  <Box component="span" sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      by {activity.user}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

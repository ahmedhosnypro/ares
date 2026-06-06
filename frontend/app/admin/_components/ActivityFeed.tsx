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
  type: string;
  message: string;
  createdAt: string;
  icon: string;
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
          {activities.map((activity, index) => (
            <ListItem key={`${activity.createdAt}-${index}`} divider>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: "primary.light", color: "primary.main" }}>
                  {getActivityIcon(activity.icon)}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={activity.message}
                secondary={
                  <Box component="span" sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.createdAt).toLocaleString()}
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

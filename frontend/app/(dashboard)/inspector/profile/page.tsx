"use client";

import { useSession } from "next-auth/react";
import { Box, Typography, Paper, Stack, Avatar, Grid, Divider, useTheme } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";

export default function InspectorProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const theme = useTheme();

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Inspector Profile
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Your personal and employee information.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ alignItems: { xs: "center", md: "flex-start" } }}>
          <Avatar
            sx={{
              width: 120,
              height: 120,
              bgcolor: theme.palette.primary.main,
              fontSize: "3rem",
              fontWeight: 800,
            }}
          >
            {user.firstName[0] || ""}
            {user.lastName[0] || ""}
          </Avatar>

          <Box sx={{ flex: 1, width: "100%" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, textAlign: { xs: "center", md: "left" } }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, textAlign: { xs: "center", md: "left" } }}
            >
              {user.roles.join(", ")}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: theme.palette.icon.email.bg, color: theme.palette.icon.email.color }}>
                    <EmailIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Email Address
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {user.email}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: theme.palette.icon.business.bg, color: theme.palette.icon.business.color }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Full Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: theme.palette.icon.phone.bg, color: theme.palette.icon.phone.color }}>
                    <BadgeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Role
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, textTransform: "capitalize" }}>
                      {user.roles.join(", ")}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

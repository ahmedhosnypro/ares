"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Button,
  Avatar,
  IconButton,
  useTheme,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getUserById, type User } from "@/api-clients/users/users";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import { logger } from "@/utils/logger";

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await getUserById(id);
        setUser(data);
      } catch (err) {
        logger.error("Failed to load user", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !id) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">User not found</Typography>
      </Box>
    );
  }

  const getStatusColor = () => {
    if (user.status === "active") return "success";
    if (user.status === "blocked") return "error";
    return "default";
  };

  return (
    <Box sx={{ p: 4, maxWidth: 700, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <IconButton
          onClick={() => {
            router.back();
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => {
            router.push(`/admin/users/${id}/edit`);
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 2.5,
            boxShadow: "none",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          }}
        >
          Edit User
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: "1px solid",
          borderColor: "border.light",
          bgcolor: "background.paper",
        }}
      >
        {/* User Header */}
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: theme.palette.primary.main,
              fontSize: 20,
            }}
          >
            {user.firstName[0]}
          </Avatar>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Chip label={user.status} size="small" color={getStatusColor()} sx={{ mt: 0.5, fontWeight: 600 }} />
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Info */}
        <Stack spacing={2}>
          {/* Email */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "border.light",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <EmailIcon color="primary" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{user.email}</Typography>
            </Box>
          </Paper>

          {/* Phone */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "border.light",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <PhoneIcon color="success" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Phone Number
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{user.phoneNumber || "-"}</Typography>
            </Box>
          </Paper>

          {/* Role */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "border.light",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <BadgeIcon color="warning" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Role
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                {user.roles.map((role: string, i: number) => (
                  <Chip key={i} label={role} size="small" color="secondary" />
                ))}
              </Stack>
            </Box>
          </Paper>
        </Stack>
      </Paper>
    </Box>
  );
}

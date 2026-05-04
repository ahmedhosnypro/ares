"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
  MenuItem,
  Chip,
  Alert,
  Divider,
  useTheme,
  Avatar,
} from "@mui/material";

import { getUserById, updateUser } from "@/api-clients/users/users";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    status: "active",
    roles: [] as string[],
  });

  // -------------------------
  // LOAD USER
  // -------------------------
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await getUserById(id);

        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phoneNumber: data.phoneNumber || "",
          status: data.status || "active",
          roles: data.roles,
        });
      } catch {
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, [id]);

  // -------------------------
  // VALIDATION
  // -------------------------
  const validate = () => {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (form.phoneNumber.trim() !== "" && form.phoneNumber.length < 8) return "Phone number is too short";
    return "";
  };

  // -------------------------
  // SUBMIT
  // -------------------------
  const handleSubmit = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError("");

      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }

      await updateUser(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber || null,
        status: form.status,
        roles: form.roles,
      });

      router.push(`/admin/users`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Update failed";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // -------------------------
  // HELPERS
  // -------------------------
  const getStatusColor = (status: string) => {
    if (status === "active") return "success";
    if (status === "blocked") return "error";
    return "default";
  };

  // -------------------------
  // LOADING
  // -------------------------
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 750, mx: "auto" }}>
      {/* HEADER */}
      <Typography variant="h5" sx={{ fontWeight: 800 }}>
        Edit User
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update user profile information and roles
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* USER BADGE (NO ID) */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "border.light",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>{form.firstName[0] || "U"}</Avatar>

          <Box>
            <Typography sx={{ fontWeight: 700 }}>
              {form.firstName} {form.lastName}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Chip label={form.status} color={getStatusColor(form.status)} sx={{ fontWeight: 600 }} />
        </Stack>
      </Paper>

      {/* FORM */}
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
        <Stack spacing={2.2}>
          {/* Personal Info */}
          <Typography color="primary" sx={{ fontWeight: 700 }}>
            Personal Information
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="First Name"
              value={form.firstName}
              onChange={e => {
                setForm({ ...form, firstName: e.target.value });
              }}
              fullWidth
            />

            <TextField
              label="Last Name"
              value={form.lastName}
              onChange={e => {
                setForm({ ...form, lastName: e.target.value });
              }}
              fullWidth
            />
          </Stack>

          <TextField
            label="Phone Number"
            value={form.phoneNumber}
            onChange={e => {
              setForm({ ...form, phoneNumber: e.target.value });
            }}
            fullWidth
          />

          <Divider />

          {/* Account */}
          <Typography color="primary" sx={{ fontWeight: 700 }}>
            Account Settings
          </Typography>

          <TextField
            select
            label="Status"
            value={form.status}
            onChange={e => {
              setForm({ ...form, status: e.target.value });
            }}
            fullWidth
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="blocked">Blocked</MenuItem>
          </TextField>

          <TextField
            label="Roles (comma separated)"
            value={form.roles.join(",")}
            onChange={e => {
              setForm({
                ...form,
                roles: e.target.value
                  .split(",")
                  .map(r => r.trim())
                  .filter(Boolean),
              });
            }}
            fullWidth
          />

          {/* ACTIONS */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => {
                router.back();
              }}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                boxShadow: "none",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

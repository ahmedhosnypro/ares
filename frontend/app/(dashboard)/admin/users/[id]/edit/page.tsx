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
  Alert,
  Grid,
  LinearProgress,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  useTheme,
  Avatar,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { z } from "zod";
import { getUserById, updateUser } from "@/api-clients/users/users";
import { logger } from "@/utils/logger";
import { alpha } from "@mui/material/styles";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    status: "active",
    role: "",
    profilePhoto: null as File | null,
    avatarUrl: "",
  });

  // -------------------------
  // LOAD USER WITH MOCK DATA FALLBACK
  // -------------------------
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getUserById(id);

        setForm({
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phoneNumber: data.phoneNumber || "",
          dateOfBirth: (data.dateOfBirth as string) || "",
          status: data.status || "active",
          role: data.roles?.[0] || "",
          profilePhoto: null,
          avatarUrl: (data.avatarUrl as string) || "",
        });
      } catch (err) {
        logger.error("Failed to load user from API, utilizing mock data", err);
        setError("Failed to load user from API. Showing mock data for testing.");

        // Mock data fallback matching create user
        setForm({
          email: "alex.mercer@ares.nexus",
          firstName: "Alex",
          lastName: "Mercer",
          phoneNumber: "5550199222",
          dateOfBirth: "1994-08-23",
          status: "active",
          role: "Admin",
          profilePhoto: null,
          avatarUrl: "",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, [id]);

  // -------------------------
  // COMPLETENESS SCORE
  // -------------------------
  const completenessItems = [
    { label: "Status selected", done: Boolean(form.status) },
    { label: "Email valid", done: Boolean(form.email) },
    { label: "Role assigned", done: Boolean(form.role), missingLabel: "Role unassigned" },
    { label: "Personal details full", done: Boolean(form.firstName && form.lastName) },
  ];
  const completenessScore = Math.round((completenessItems.filter(i => i.done).length / completenessItems.length) * 100);

  // -------------------------
  // VALIDATION SCHEMA
  // -------------------------
  const editUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z
      .string()
      .optional()
      .refine(v => !v || /^[0-9+\s\-().]{8,15}$/.test(v), {
        message: "Invalid phone number",
      }),
    status: z.string(),
    role: z.string().min(1, "Role is required"),
  });

  // -------------------------
  // SUBMIT HANDLER
  // -------------------------
  const handleSubmit = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const result = editUserSchema.safeParse(form);
      if (!result.success) {
        const simplified: Record<string, string | undefined> = {};
        result.error.issues.forEach(issue => {
          const key = issue.path[0] as string;
          if (!simplified[key]) simplified[key] = issue.message;
        });
        setFieldErrors(simplified);
        return;
      }

      await updateUser(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber || null,
        status: form.status,
        roles: [form.role],
      });

      router.push("/admin/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update user failed");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------
  // STYLES & THEMING (No Hardcoded Colors)
  // -------------------------
  const fieldLabel = {
    fontWeight: 600,
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: theme.palette.text.secondary,
    mb: 0.75,
  };

  const bigInputSx = {
    "& .MuiInputBase-root": { fontSize: 15, minHeight: 48 },
    "& .MuiInputBase-input": { py: 1.5 },
  };

  const sectionIconSx = {
    width: 40,
    height: 40,
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      {/* Breadcrumb */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: "center", flexWrap: "wrap", mb: 2, color: theme.palette.text.secondary, fontSize: 13 }}
      >
        <Typography
          variant="caption"
          sx={{ cursor: "pointer", "&:hover": { color: theme.palette.primary.main } }}
          onClick={() => router.push("/admin/users")}
        >
          Users
        </Typography>
        <NavigateNextIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
          Edit User
        </Typography>
      </Stack>

      {/* Page Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 2, sm: 0 },
          mb: 3,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar
              src={form.profilePhoto ? URL.createObjectURL(form.profilePhoto) : form.avatarUrl}
              sx={{ bgcolor: theme.palette.primary.main, fontWeight: 700, width: 48, height: 48 }}
            >
              {form.firstName[0]?.toUpperCase() || "U"}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: "1.15rem", sm: "1.35rem", md: "1.5rem" } }}
              >
                Edit: {form.firstName} {form.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Update and manage settings for account ({form.email || "No Email"})
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            sx={{
              flex: { xs: 1, sm: "unset" },
              borderRadius: 2,
              fontWeight: 500,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              "&:hover": { borderColor: theme.palette.text.secondary },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? undefined : <SaveOutlinedIcon />}
            onClick={() => void handleSubmit()}
            disabled={saving}
            sx={{
              flex: { xs: 1, sm: "unset" },
              borderRadius: 2,
              px: { xs: 1.5, sm: 2.5 },
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Two-column layout */}
      <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ alignItems: "flex-start" }}>
        {/* LEFT: Form Cards */}
        <Grid size={{ xs: 12, lg: 8.5 }}>
          {/* Account Credentials */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
              mb: { xs: 2, md: 2.5 },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
              <Box
                sx={{
                  ...sectionIconSx,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              >
                <LockOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 17 } }}>Account Settings</Typography>
                <Typography variant="caption" color="text.secondary">
                  Primary system credentials.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={{ xs: 2, sm: 3 }}>
              {/* Email (Readonly in Edit) */}
              <Box>
                <Typography sx={fieldLabel}>Email Address</Typography>
                <TextField
                  value={form.email}
                  disabled
                  fullWidth
                  sx={bigInputSx}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.disabled }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Stack>
          </Paper>

          {/* Personal Details */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
              <Box
                sx={{ ...sectionIconSx, bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}
              >
                <PersonOutlineIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 17 } }}>Personal Details</Typography>
                <Typography variant="caption" color="text.secondary">
                  Identity and contact information.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={{ xs: 2, sm: 3 }}>
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={fieldLabel}>
                    First Name{" "}
                    <Box component="span" sx={{ color: theme.palette.error.main }}>
                      *
                    </Box>
                  </Typography>
                  <TextField
                    placeholder="John"
                    value={form.firstName}
                    onChange={e => {
                      setForm({ ...form, firstName: e.target.value });
                      if (fieldErrors.firstName) setFieldErrors(p => ({ ...p, firstName: undefined }));
                    }}
                    fullWidth
                    error={Boolean(fieldErrors.firstName)}
                    helperText={fieldErrors.firstName}
                    sx={bigInputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={fieldLabel}>
                    Last Name{" "}
                    <Box component="span" sx={{ color: theme.palette.error.main }}>
                      *
                    </Box>
                  </Typography>
                  <TextField
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={e => {
                      setForm({ ...form, lastName: e.target.value });
                      if (fieldErrors.lastName) setFieldErrors(p => ({ ...p, lastName: undefined }));
                    }}
                    fullWidth
                    error={Boolean(fieldErrors.lastName)}
                    helperText={fieldErrors.lastName}
                    sx={bigInputSx}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={fieldLabel}>Phone Number</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: { xs: "flex-start", sm: "center" },
                        px: 1.5,
                        border: "1px solid",
                        borderColor: theme.palette.divider,
                        borderRadius: 1.5,
                        bgcolor: theme.palette.background.default,
                        fontSize: 14,
                        whiteSpace: "nowrap",
                        color: theme.palette.text.secondary,
                        width: { xs: "100%", sm: "auto" },
                        minWidth: { sm: 64 },
                        minHeight: 48,
                      }}
                    >
                      +1 ▾
                    </Box>
                    <TextField
                      placeholder="(555) 000-0000"
                      value={form.phoneNumber}
                      onChange={e => {
                        setForm({ ...form, phoneNumber: e.target.value });
                        if (fieldErrors.phoneNumber) setFieldErrors(p => ({ ...p, phoneNumber: undefined }));
                      }}
                      fullWidth
                      error={Boolean(fieldErrors.phoneNumber)}
                      helperText={fieldErrors.phoneNumber}
                      sx={bigInputSx}
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={fieldLabel}>Date of Birth</Typography>
                  <TextField
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={bigInputSx}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT: Sidebar */}
        <Grid size={{ xs: 12, lg: 3.5 }}>
          {/* Profile Photo */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
              mb: 2,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Profile Photo</Typography>
            <Box
              component="label"
              htmlFor="profile-photo-input"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed",
                borderColor: theme.palette.divider,
                borderRadius: 2.5,
                height: { xs: 130, sm: 120 },
                cursor: "pointer",
                bgcolor: theme.palette.background.default,
                gap: 1,
                transition: "border-color 0.2s",
                "&:hover": { borderColor: theme.palette.primary.main },
              }}
            >
              <PhotoCameraOutlinedIcon sx={{ color: theme.palette.text.disabled, fontSize: 30 }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontWeight: 500 }}>
                {form.profilePhoto || form.avatarUrl ? "Change Photo" : "Upload"}
              </Typography>
              <input
                id="profile-photo-input"
                type="file"
                accept=".jpeg,.jpg,.png,.gif"
                hidden
                onChange={e => setForm(prev => ({ ...prev, profilePhoto: e.target.files?.[0] ?? null }))}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1.5, display: "block", textAlign: "center", lineHeight: 1.6 }}
            >
              Allowed *.jpeg, *.jpg, *.png, *.gif{"\n"}Max size of 3.1 MB
            </Typography>
          </Paper>

          {/* Access Control */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
              mb: 2,
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Access Control</Typography>
                <Typography variant="caption" color="text.secondary">
                  Permissions and status.
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ ...fieldLabel, mb: 1 }}>
                System Role{" "}
                <Box component="span" sx={{ color: theme.palette.error.main }}>
                  *
                </Box>
              </Typography>
              <TextField
                select
                value={form.role}
                onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                fullWidth
                size="small"
                error={Boolean(fieldErrors.role)}
                helperText={fieldErrors.role}
                slotProps={{
                  select: { displayEmpty: true },
                  input: { style: { fontSize: 13 } },
                }}
              >
                <MenuItem value="" disabled>
                  <em style={{ color: theme.palette.text.disabled }}>Select a role...</em>
                </MenuItem>
                <MenuItem value="Supplier">Supplier</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="User">User</MenuItem>
              </TextField>
            </Box>

            <Box>
              <Typography sx={{ ...fieldLabel, mb: 1 }}>Account Status</Typography>
              <ToggleButtonGroup
                value={form.status}
                exclusive
                onChange={(_, v) => {
                  if (v) setForm(prev => ({ ...prev, status: v }));
                }}
                fullWidth
                size="small"
                sx={{
                  flexWrap: "nowrap",
                  "& .MuiToggleButton-root": {
                    flex: 1,
                    minWidth: 0,
                    fontSize: { xs: 10, sm: 11 },
                    fontWeight: 600,
                    textTransform: "none",
                    border: "1.5px solid",
                    borderColor: theme.palette.divider,
                    flexDirection: "column",
                    gap: 0.25,
                    py: 0.75,
                    px: { xs: 0.5, sm: 1 },
                    color: theme.palette.text.secondary,
                    "&.Mui-selected": { bgcolor: "transparent" },
                  },
                  "& .MuiToggleButton-root[value='active'].Mui-selected": {
                    borderColor: theme.palette.status.active.main,
                    color: theme.palette.status.active.main,
                    bgcolor: alpha(theme.palette.status.active.main, 0.15),
                  },
                  "& .MuiToggleButton-root[value='pending'].Mui-selected": {
                    borderColor: theme.palette.status.pending.main,
                    color: theme.palette.status.pending.main,
                    bgcolor: alpha(theme.palette.status.pending.main, 0.15),
                  },
                  "& .MuiToggleButton-root[value='blocked'].Mui-selected": {
                    borderColor: theme.palette.status.blocked.main,
                    color: theme.palette.status.blocked.main,
                    bgcolor: alpha(theme.palette.status.blocked.main, 0.15),
                  },
                }}
              >
                <ToggleButton value="active">
                  <CheckCircleOutlineIcon sx={{ fontSize: { xs: 13, sm: 14 } }} />
                  Active
                </ToggleButton>
                <ToggleButton value="pending">
                  <AccessTimeIcon sx={{ fontSize: { xs: 13, sm: 14 } }} />
                  Pending
                </ToggleButton>
                <ToggleButton value="blocked">
                  <BlockIcon sx={{ fontSize: { xs: 13, sm: 14 } }} />
                  Blocked
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Paper>

          {/* Profile Completeness */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Profile Progress</Typography>
              <Chip
                label="Update mode"
                size="small"
                sx={{
                  fontSize: 10,
                  fontWeight: 600,
                  height: 20,
                  bgcolor: theme.palette.action.hover,
                  color: theme.palette.text.secondary,
                }}
              />
            </Stack>

            <LinearProgress
              variant="determinate"
              value={completenessScore}
              sx={{
                borderRadius: 2,
                height: 5,
                mb: 0.75,
                bgcolor: theme.palette.action.hover,
                "& .MuiLinearProgress-bar": { borderRadius: 2, bgcolor: theme.palette.primary.main },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              {completenessScore}% valid data context.
            </Typography>

            <Stack spacing={0.75}>
              {completenessItems.map(item => (
                <Stack key={item.label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  {item.done ? (
                    <CheckCircleIcon sx={{ fontSize: 14, color: theme.palette.status.active.main, flexShrink: 0 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: theme.palette.divider, flexShrink: 0 }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{ color: item.done ? theme.palette.status.active.main : theme.palette.text.disabled }}
                  >
                    {item.done ? item.label : (item.missingLabel ?? item.label)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

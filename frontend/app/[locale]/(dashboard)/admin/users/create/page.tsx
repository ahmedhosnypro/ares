"use client";

import { useState } from "react";
import { useRouter } from "@/shared/i18n/routing";
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
  FormControlLabel,
  Checkbox,
  LinearProgress,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Select,
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
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { z } from "zod";
import { passwordSchema } from "@/lib/validation/schemas";
import { createUser, uploadUserPhoto } from "@/api-clients/users/users";
import { createInspector } from "@/api-clients/inspectors/inspectors";
import { createSupplier } from "@/api-clients/suppliers/suppliers";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import BusinessIcon from "@mui/icons-material/Business";

export default function CreateUserPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const phoneCodes = [
    { code: "+1", label: "US/CA" },
    { code: "+44", label: "UK" },
    { code: "+20", label: "EG" },
    { code: "+971", label: "AE" },
    { code: "+966", label: "SA" },
    { code: "+91", label: "IN" },
    { code: "+92", label: "PK" },
    { code: "+61", label: "AU" },
    { code: "+81", label: "JP" },
    { code: "+49", label: "DE" },
    { code: "+33", label: "FR" },
  ];

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneCountryCode: "+1",
    phoneNumber: "",
    dateOfBirth: "",
    status: "active",
    role: "",
    requirePasswordChange: false,
    profilePhoto: null as File | null,
    // Inspector fields
    employeeCode: "",
    isAvailable: true,
    // Supplier fields
    companyName: "",
    commercialRegistrationNumber: "",
    taxId: "",
  });

  const completenessItems = [
    { label: "Status selected", done: Boolean(form.status) },
    { label: "Email missing", done: Boolean(form.email), missingLabel: "Email missing" },
    { label: "Password missing", done: Boolean(form.password), missingLabel: "Password missing" },
    { label: "Role unassigned", done: Boolean(form.role), missingLabel: "Role unassigned" },
  ];
  const completenessScore = Math.round((completenessItems.filter(i => i.done).length / completenessItems.length) * 100);

  const createUserSchema = z
    .object({
      email: z.email({ message: "Invalid email" }),
      password: passwordSchema,
      confirmPassword: z.string(),
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
      employeeCode: z.string().optional(),
      companyName: z.string().optional(),
      commercialRegistrationNumber: z.string().optional(),
      taxId: z.string().optional(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
    .superRefine((data, ctx) => {
      if (data.role === "Inspector") {
        if (!data.employeeCode || data.employeeCode.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Employee code is required",
            path: ["employeeCode"],
          });
        }
      }
      if (data.role === "Supplier") {
        if (!data.companyName || data.companyName.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Company name is required",
            path: ["companyName"],
          });
        }
        if (!data.commercialRegistrationNumber || data.commercialRegistrationNumber.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Commercial Registration Number is required",
            path: ["commercialRegistrationNumber"],
          });
        }
        if (!data.taxId || data.taxId.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tax ID is required",
            path: ["taxId"],
          });
        }
      }
    });

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setFieldErrors({});
      const result = createUserSchema.safeParse(form);
      if (!result.success) {
        const simplified: Record<string, string | undefined> = {};
        result.error.issues.forEach(issue => {
          const key = issue.path[0] as string;
          if (!simplified[key]) simplified[key] = issue.message;
        });
        setFieldErrors(simplified);
        return;
      }

      let res: any;
      const finalPhoneNumber = form.phoneNumber ? `${form.phoneCountryCode} ${form.phoneNumber}`.trim() : undefined;

      if (form.role === "Inspector") {
        res = await createInspector({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: finalPhoneNumber || null,
          employeeCode: form.employeeCode.trim(),
          isAvailable: form.isAvailable,
        });
      } else if (form.role === "Supplier") {
        res = await createSupplier({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: finalPhoneNumber || "",
          status: form.status,
          companyName: form.companyName.trim(),
          commercialRegistrationNumber: form.commercialRegistrationNumber.trim(),
          taxId: form.taxId.trim(),
        });
      } else {
        res = await createUser({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: finalPhoneNumber || "",
          status: form.status,
          roles: [form.role],
          dateOfBirth: form.dateOfBirth || undefined,
        });
      }

      // Upload photo if selected
      if (form.profilePhoto && res) {
        try {
          const created = res as unknown as { userId?: string };
          // If it's a supplier it just returns ID string, so we'll check typeof
          const userId = typeof res === "string" ? res : created.userId;
          if (userId) {
            await uploadUserPhoto(userId, form.profilePhoto);
          }
        } catch {
          // Photo upload failure is non-critical — user was created successfully
        }
      }

      router.push("/admin/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create user failed");
    } finally {
      setSaving(false);
    }
  };

  const fieldLabel = {
    fontWeight: 600,
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: "text.secondary",
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

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      {/* Breadcrumb */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: "center", flexWrap: "wrap", mb: 2, color: "text.secondary", fontSize: 13 }}
      >
        <Typography
          variant="caption"
          sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
          onClick={() => {
            router.push("/admin/users");
          }}
        >
          Users
        </Typography>
        <NavigateNextIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600 }}>
          Create User
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
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: "1.15rem", sm: "1.35rem", md: "1.5rem" } }}
          >
            Create New User
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Provision a new account within the ARES Nexus environment.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}>
          <Button
            variant="outlined"
            onClick={() => {
              router.back();
            }}
            sx={{
              flex: { xs: 1, sm: "unset" },
              borderRadius: 2,
              fontWeight: 500,
              borderColor: "divider",
              color: "text.primary",
              whiteSpace: "nowrap",
              "&:hover": { borderColor: "text.secondary" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? undefined : <AddBoxOutlinedIcon />}
            onClick={() => {
              void handleSubmit();
            }}
            disabled={saving}
            sx={{
              flex: { xs: 1, sm: "unset" },
              borderRadius: 2,
              px: { xs: 1.5, sm: 2.5 },
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "Create Account"}
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
        {/* LEFT: form cards */}
        <Grid size={{ xs: 12, lg: 8.5 }}>
          {/* Account Credentials */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              mb: { xs: 2, md: 2.5 },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
              <Box sx={{ ...sectionIconSx, bgcolor: "primary.lighter", color: "primary.main" }}>
                <LockOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 17 } }}>Account Credentials</Typography>
                <Typography variant="caption" color="text.secondary">
                  Primary authentication details.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={{ xs: 2, sm: 3 }}>
              {/* Email */}
              <Box>
                <Typography sx={fieldLabel}>
                  Email Address{" "}
                  <Box component="span" sx={{ color: "error.main" }}>
                    *
                  </Box>
                </Typography>
                <TextField
                  placeholder="user@company.com"
                  value={form.email}
                  onChange={e => {
                    setForm({ ...form, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined }));
                  }}
                  fullWidth
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  sx={bigInputSx}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {/* Password row — stacks to full-width columns on xs */}
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={fieldLabel}>
                    Temporary Password{" "}
                    <Box component="span" sx={{ color: "error.main" }}>
                      *
                    </Box>
                  </Typography>
                  <TextField
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={e => {
                      setForm({ ...form, password: e.target.value });
                      if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined }));
                    }}
                    fullWidth
                    error={Boolean(fieldErrors.password)}
                    helperText={fieldErrors.password}
                    sx={bigInputSx}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => {
                                setShowPassword(v => !v);
                              }}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={fieldLabel}>
                    Confirm Password{" "}
                    <Box component="span" sx={{ color: "error.main" }}>
                      *
                    </Box>
                  </Typography>
                  <TextField
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={e => {
                      setForm({ ...form, confirmPassword: e.target.value });
                      if (fieldErrors.confirmPassword) setFieldErrors(p => ({ ...p, confirmPassword: undefined }));
                    }}
                    fullWidth
                    error={Boolean(fieldErrors.confirmPassword)}
                    helperText={fieldErrors.confirmPassword}
                    sx={bigInputSx}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => {
                                setShowConfirmPassword(v => !v);
                              }}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                Must be at least 12 characters.
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.requirePasswordChange}
                    onChange={e => {
                      setForm({ ...form, requirePasswordChange: e.target.checked });
                    }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 14 } }}>
                    Require password change on first login
                  </Typography>
                }
                sx={{ mt: -1 }}
              />
            </Stack>
          </Paper>

          {/* Personal Details */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
              <Box sx={{ ...sectionIconSx, bgcolor: "info.lighter", color: "info.main" }}>
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
                    <Box component="span" sx={{ color: "error.main" }}>
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
                    <Box component="span" sx={{ color: "error.main" }}>
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
                  {/* On xs: stack vertically so the flag box doesn't crush the input */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Select
                      value={form.phoneCountryCode}
                      onChange={e => setForm({ ...form, phoneCountryCode: e.target.value })}
                      displayEmpty
                      renderValue={selected => selected}
                      sx={{
                        bgcolor: "background.neutral",
                        borderRadius: 1.5,
                        color: "text.secondary",
                        fontSize: 14,
                        width: { xs: "100%", sm: "110px" },
                        minWidth: { sm: 90 },
                        minHeight: 48,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "divider",
                        },
                      }}
                    >
                      {phoneCodes.map(c => (
                        <MenuItem key={c.code} value={c.code}>
                          {c.code} {c.label}
                        </MenuItem>
                      ))}
                    </Select>
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
                    onChange={e => {
                      setForm({ ...form, dateOfBirth: e.target.value });
                    }}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={bigInputSx}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {/* Dynamic Role Sections */}
          {form.role === "Inspector" && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                mt: { xs: 2, md: 2.5 },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
                <Box sx={{ ...sectionIconSx, bgcolor: "warning.lighter", color: "warning.main" }}>
                  <AssignmentIndIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 17 } }}>Inspector Details</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Required fields for field inspectors.
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={{ xs: 2, sm: 3 }}>
                <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={fieldLabel}>
                      Employee Code{" "}
                      <Box component="span" sx={{ color: "error.main" }}>
                        *
                      </Box>
                    </Typography>
                    <TextField
                      placeholder="e.g. INS-001"
                      value={form.employeeCode}
                      onChange={e => {
                        setForm({ ...form, employeeCode: e.target.value });
                        if (fieldErrors.employeeCode) setFieldErrors(p => ({ ...p, employeeCode: undefined }));
                      }}
                      fullWidth
                      error={Boolean(fieldErrors.employeeCode)}
                      helperText={fieldErrors.employeeCode}
                      sx={bigInputSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={fieldLabel}>Availability</Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.isAvailable}
                          onChange={e => setForm({ ...form, isAvailable: e.target.checked })}
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          Available for Assignments
                        </Typography>
                      }
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          )}

          {form.role === "Supplier" && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                mt: { xs: 2, md: 2.5 },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
                <Box sx={{ ...sectionIconSx, bgcolor: "success.lighter", color: "success.main" }}>
                  <BusinessIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 17 } }}>Supplier Details</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Required business information.
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={{ xs: 2, sm: 3 }}>
                <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                  <Grid size={{ xs: 12, sm: 12 }}>
                    <Typography sx={fieldLabel}>
                      Company Name{" "}
                      <Box component="span" sx={{ color: "error.main" }}>
                        *
                      </Box>
                    </Typography>
                    <TextField
                      placeholder="Acme Rentals LLC"
                      value={form.companyName}
                      onChange={e => {
                        setForm({ ...form, companyName: e.target.value });
                        if (fieldErrors.companyName) setFieldErrors(p => ({ ...p, companyName: undefined }));
                      }}
                      fullWidth
                      error={Boolean(fieldErrors.companyName)}
                      helperText={fieldErrors.companyName}
                      sx={bigInputSx}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={fieldLabel}>
                      Commercial Registration No.{" "}
                      <Box component="span" sx={{ color: "error.main" }}>
                        *
                      </Box>
                    </Typography>
                    <TextField
                      placeholder="e.g. CR-123456"
                      value={form.commercialRegistrationNumber}
                      onChange={e => {
                        setForm({ ...form, commercialRegistrationNumber: e.target.value });
                        if (fieldErrors.commercialRegistrationNumber)
                          setFieldErrors(p => ({ ...p, commercialRegistrationNumber: undefined }));
                      }}
                      fullWidth
                      error={Boolean(fieldErrors.commercialRegistrationNumber)}
                      helperText={fieldErrors.commercialRegistrationNumber}
                      sx={bigInputSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={fieldLabel}>
                      Tax ID{" "}
                      <Box component="span" sx={{ color: "error.main" }}>
                        *
                      </Box>
                    </Typography>
                    <TextField
                      placeholder="e.g. TX-987654"
                      value={form.taxId}
                      onChange={e => {
                        setForm({ ...form, taxId: e.target.value });
                        if (fieldErrors.taxId) setFieldErrors(p => ({ ...p, taxId: undefined }));
                      }}
                      fullWidth
                      error={Boolean(fieldErrors.taxId)}
                      helperText={fieldErrors.taxId}
                      sx={bigInputSx}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          )}
        </Grid>

        {/* RIGHT: sidebar */}
        <Grid size={{ xs: 12, lg: 3.5 }}>
          {/* Profile Photo */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
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
                borderColor: "divider",
                borderRadius: 2.5,
                height: { xs: 130, sm: 120 },
                cursor: "pointer",
                bgcolor: "background.neutral",
                gap: 1,
                transition: "border-color 0.2s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <PhotoCameraOutlinedIcon sx={{ color: "text.disabled", fontSize: 30 }} />
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 500 }}>
                Upload
              </Typography>
              <input
                id="profile-photo-input"
                type="file"
                accept=".jpeg,.jpg,.png,.gif"
                hidden
                onChange={e => {
                  setForm(prev => ({ ...prev, profilePhoto: e.target.files?.[0] ?? null }));
                }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.disabled"
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
              borderColor: "divider",
              bgcolor: "background.paper",
              mb: 2,
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  bgcolor: "warning.lighter",
                  color: "warning.main",
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
                <Box component="span" sx={{ color: "error.main" }}>
                  *
                </Box>
              </Typography>
              <TextField
                select
                value={form.role}
                onChange={e => {
                  setForm(prev => ({ ...prev, role: e.target.value }));
                }}
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
                  <em style={{ color: "var(--mui-palette-text-disabled)" }}>Select a role...</em>
                </MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Customer">Customer</MenuItem>
                <MenuItem value="Supplier">Supplier</MenuItem>
                <MenuItem value="Driver">Driver</MenuItem>
                <MenuItem value="Inspector">Inspector</MenuItem>
              </TextField>
            </Box>

            <Box>
              <Typography sx={{ ...fieldLabel, mb: 1 }}>Account Status</Typography>
              <ToggleButtonGroup
                value={form.status}
                exclusive
                onChange={(_, v) => {
                  const status = v as string;
                  if (status) setForm(prev => ({ ...prev, status }));
                }}
                fullWidth
                size="small"
                sx={{
                  // Never let the 3 buttons overflow — allow wrap only as last resort
                  flexWrap: "nowrap",
                  "& .MuiToggleButton-root": {
                    flex: 1,
                    minWidth: 0, // allow shrinking below content size
                    fontSize: { xs: 10, sm: 11 },
                    fontWeight: 600,
                    textTransform: "none",
                    border: "1.5px solid",
                    borderColor: "divider",
                    flexDirection: "column",
                    gap: 0.25,
                    py: 0.75,
                    px: { xs: 0.5, sm: 1 },
                    color: "text.secondary",
                    "&.Mui-selected": { bgcolor: "transparent" },
                  },
                  "& .MuiToggleButton-root[value='active'].Mui-selected": {
                    borderColor: "success.main",
                    color: "success.main",
                    bgcolor: "success.lighter",
                  },
                  "& .MuiToggleButton-root[value='pending'].Mui-selected": {
                    borderColor: "warning.main",
                    color: "warning.main",
                    bgcolor: "warning.lighter",
                  },
                  "& .MuiToggleButton-root[value='blocked'].Mui-selected": {
                    borderColor: "error.main",
                    color: "error.main",
                    bgcolor: "error.lighter",
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
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Profile Completeness</Typography>
              <Chip
                label="Draft"
                size="small"
                sx={{ fontSize: 10, fontWeight: 600, height: 20, bgcolor: "action.hover", color: "text.secondary" }}
              />
            </Stack>

            <LinearProgress
              variant="determinate"
              value={completenessScore}
              sx={{
                borderRadius: 2,
                height: 5,
                mb: 0.75,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": { borderRadius: 2, bgcolor: "primary.main" },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              {completenessScore}% complete.
              {completenessScore < 100 ? " Required fields missing." : " Ready to provision."}
            </Typography>

            <Stack spacing={0.75}>
              {completenessItems.map(item => (
                <Stack key={item.label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  {item.done ? (
                    <CheckCircleIcon sx={{ fontSize: 14, color: "success.main", flexShrink: 0 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: "divider", flexShrink: 0 }} />
                  )}
                  <Typography variant="caption" sx={{ color: item.done ? "success.main" : "text.disabled" }}>
                    {item.done
                      ? item.label.replace(" missing", " ✓").replace(" unassigned", " assigned")
                      : (item.missingLabel ?? item.label)}
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

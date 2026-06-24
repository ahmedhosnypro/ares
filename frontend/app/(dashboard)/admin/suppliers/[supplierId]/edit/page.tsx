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
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { z } from "zod";
import { getSupplierById, updateSupplier } from "@/api-clients/suppliers/suppliers";
import { logger } from "@/utils/logger";
import { alpha } from "@mui/material/styles";

const MOCK_PLATFORM_ROLES = ["Supplier Admin", "Supplier Staff", "Supplier Viewer"];
const MOCK_COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Egypt", "Kuwait", "Qatar", "Bahrain", "Oman"];
const PHONE_COUNTRY_CODES = [
  { code: "+1", label: "+1" },
  { code: "+44", label: "+44" },
  { code: "+971", label: "+971" },
  { code: "+966", label: "+966" },
  { code: "+20", label: "+20" },
];

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const id = Array.isArray(params.supplierId) ? params.supplierId[0] : params.supplierId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    phoneCountryCode: "+971",
    status: "active",
    companyName: "",
    commercialRegistrationNumber: "",
    taxId: "",
    platformRole: "Supplier Admin",
    country: "",
    city: "",
    streetAddress: "",
    logoPhoto: null as File | null,
    logoUrl: "",
  });

  // -------------------------
  // LOAD SUPPLIER WITH MOCK DATA FALLBACK
  // -------------------------
  useEffect(() => {
    if (!id) return;

    const fetchSupplier = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getSupplierById(id);

        // Try parsing/splitting phone country code if phoneNumber exists and starts with +
        let phoneVal = data.phoneNumber || "";
        let codeVal = "+971";
        for (const c of PHONE_COUNTRY_CODES) {
          if (phoneVal.startsWith(c.code)) {
            codeVal = c.code;
            phoneVal = phoneVal.slice(c.code.length);
            break;
          }
        }

        setForm({
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phoneNumber: phoneVal,
          phoneCountryCode: codeVal,
          status: data.status || "active",
          companyName: data.companyProfile?.companyName || "",
          commercialRegistrationNumber: data.companyProfile?.commercialRegistrationNumber || "",
          taxId: data.companyProfile?.taxId || "",
          platformRole: "Supplier Admin", // mock
          country: "", // mock
          city: "", // mock
          streetAddress: "", // mock
          logoPhoto: null,
          logoUrl: "", // mock
        });
      } catch (err) {
        logger.error("Failed to load supplier from API, utilizing mock data", err);
        setError("Failed to load supplier from API. Showing mock data for testing.");
        
        // Mock data fallback matching create supplier
        setForm({
          email: "supplier@company.com",
          firstName: "Jane",
          lastName: "Doe",
          phoneNumber: "5550199222",
          phoneCountryCode: "+971",
          status: "active",
          companyName: "Apex Logistics Rentals",
          commercialRegistrationNumber: "CR-123456",
          taxId: "TX-987654",
          platformRole: "Supplier Admin",
          country: "United Arab Emirates",
          city: "Dubai",
          streetAddress: "Business Bay, Tower A",
          logoPhoto: null,
          logoUrl: "",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchSupplier();
  }, [id]);

  const handleLogoChange = (file: File | null) => {
    if (!file) {
      setLogoPreview(null);
      setForm(prev => ({ ...prev, logoPhoto: null }));
      return;
    }
    setForm(prev => ({ ...prev, logoPhoto: file }));
    const reader = new FileReader();
    reader.onload = e => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // -------------------------
  // COMPLETENESS SCORE
  // -------------------------
  const completenessItems: { label: string; done: boolean; missingLabel?: string }[] = [
    { label: "Status selected", done: Boolean(form.status) },
    { label: "Email valid", done: Boolean(form.email) },
    { label: "Company profile full", done: Boolean(form.companyName && form.commercialRegistrationNumber && form.taxId), missingLabel: "Company profile incomplete" },
    { label: "Representative details full", done: Boolean(form.firstName && form.lastName && form.phoneNumber), missingLabel: "Representative details incomplete" },
  ];
  const completenessScore = Math.round((completenessItems.filter(i => i.done).length / completenessItems.length) * 100);

  // -------------------------
  // VALIDATION SCHEMA
  // -------------------------
  const editSupplierSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .refine(v => /^[0-9+\s\-().]{8,15}$/.test(v), {
        message: "Invalid phone number",
      }),
    status: z.string(),
    companyName: z.string().min(1, "Company name is required"),
    commercialRegistrationNumber: z.string().min(1, "Commercial registration is required"),
    taxId: z.string().min(1, "Tax ID is required"),
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

      const result = editSupplierSchema.safeParse(form);
      if (!result.success) {
        const simplified: Record<string, string | undefined> = {};
        result.error.issues.forEach(issue => {
          const key = issue.path[0] as string;
          if (!simplified[key]) simplified[key] = issue.message;
        });
        setFieldErrors(simplified);
        return;
      }

      await updateSupplier(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: `${form.phoneCountryCode}${form.phoneNumber}`,
        status: form.status,
        companyName: form.companyName.trim(),
        commercialRegistrationNumber: form.commercialRegistrationNumber.trim(),
        taxId: form.taxId.trim(),
      });

      router.push("/admin/suppliers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update supplier failed");
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

  const initials = form.companyName[0]?.toUpperCase() || "S";

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
          onClick={() => router.push("/admin/suppliers")}
        >
          Suppliers
        </Typography>
        <NavigateNextIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
          Edit Supplier
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
              src={logoPreview || form.logoUrl}
              sx={{ bgcolor: theme.palette.primary.main, fontWeight: 700, width: 48, height: 48 }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: "1.15rem", sm: "1.35rem", md: "1.5rem" } }}
              >
                Edit: {form.companyName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Update and manage settings for supplier ({form.email || "No Email"})
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
              <Box sx={{ ...sectionIconSx, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
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

          {/* Company Profile */}
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
              <Box sx={{ ...sectionIconSx, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                <BusinessCenterOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 17 } }}>Company Profile</Typography>
                <Typography variant="caption" color="text.secondary">
                  Official business registration details.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={{ xs: 2, sm: 3 }}>
              <Box>
                <Typography sx={fieldLabel}>
                  Company Name{" "}
                  <Box component="span" sx={{ color: theme.palette.error.main }}>
                    *
                  </Box>
                </Typography>
                <TextField
                  placeholder="e.g. Apex Logistics Rentals"
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
              </Box>

              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={fieldLabel}>
                    Commercial Registration Number{" "}
                    <Box component="span" sx={{ color: theme.palette.error.main }}>
                      *
                    </Box>
                  </Typography>
                  <TextField
                    placeholder="CRN-0000-0000"
                    value={form.commercialRegistrationNumber}
                    onChange={e => {
                      setForm({ ...form, commercialRegistrationNumber: e.target.value });
                      if (fieldErrors.commercialRegistrationNumber) {
                        setFieldErrors(p => ({ ...p, commercialRegistrationNumber: undefined }));
                      }
                    }}
                    fullWidth
                    error={Boolean(fieldErrors.commercialRegistrationNumber)}
                    helperText={fieldErrors.commercialRegistrationNumber}
                    sx={bigInputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={fieldLabel}>
                    Tax Identification Number{" "}
                    <Box component="span" sx={{ color: theme.palette.error.main }}>
                      *
                    </Box>
                  </Typography>
                  <TextField
                    placeholder="TAX-0000-0000"
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

          {/* Representative Info */}
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
              <Box sx={{ ...sectionIconSx, bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                <PersonOutlineIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 17 } }}>Representative Info</Typography>
                <Typography variant="caption" color="text.secondary">
                  Primary contact person details.
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
                    placeholder="Jane"
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

              <Box>
                <Typography sx={fieldLabel}>
                  Phone Number{" "}
                  <Box component="span" sx={{ color: theme.palette.error.main }}>
                    *
                  </Box>
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    select
                    value={form.phoneCountryCode}
                    onChange={e => {
                      setForm(prev => ({ ...prev, phoneCountryCode: e.target.value }));
                    }}
                    sx={{
                      width: { xs: "100%", sm: 100 },
                      "& .MuiInputBase-root": { fontSize: 14, minHeight: 48 },
                    }}
                  >
                    {PHONE_COUNTRY_CODES.map(c => (
                      <MenuItem key={c.code} value={c.code}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </TextField>
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
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT: Sidebar */}
        <Grid size={{ xs: 12, lg: 3.5 }}>
          {/* Company Logo */}
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
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Company Logo</Typography>
            <Box
              component="label"
              htmlFor="logo-photo-input"
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
              {logoPreview || form.logoUrl ? (
                <Box
                  component="img"
                  src={logoPreview || form.logoUrl}
                  sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }}
                />
              ) : (
                <>
                  <PhotoCameraOutlinedIcon sx={{ color: theme.palette.text.disabled, fontSize: 30 }} />
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontWeight: 500 }}>
                    Upload Logo
                  </Typography>
                </>
              )}
              <input
                id="logo-photo-input"
                type="file"
                accept=".jpeg,.jpg,.png,.gif"
                hidden
                onChange={e => {
                  handleLogoChange(e.target.files?.[0] ?? null);
                }}
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
                value={form.platformRole}
                onChange={e => setForm(prev => ({ ...prev, platformRole: e.target.value }))}
                fullWidth
                size="small"
                slotProps={{
                  select: { displayEmpty: true },
                  input: { style: { fontSize: 13 } },
                }}
              >
                {MOCK_PLATFORM_ROLES.map(r => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
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

          {/* Business Address */}
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
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: "info.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <LocationOnOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Business Address</Typography>
                <Typography variant="caption" color="text.secondary">
                  Headquarters location.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Typography sx={{ ...fieldLabel, mb: 1 }}>Country</Typography>
                <TextField
                  select
                  value={form.country}
                  onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                  fullWidth
                  size="small"
                  slotProps={{
                    select: { displayEmpty: true },
                    input: { style: { fontSize: 13 } },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em style={{ color: theme.palette.text.disabled }}>Select country...</em>
                  </MenuItem>
                  {MOCK_COUNTRIES.map(c => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <Typography sx={{ ...fieldLabel, mb: 1 }}>City</Typography>
                <TextField
                  placeholder="e.g. Dubai"
                  value={form.city}
                  onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                  fullWidth
                  size="small"
                  slotProps={{
                    input: { style: { fontSize: 13 } },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ ...fieldLabel, mb: 1 }}>Street Address</Typography>
                <TextField
                  placeholder="Building, Floor, Street..."
                  value={form.streetAddress}
                  onChange={e => setForm(prev => ({ ...prev, streetAddress: e.target.value }))}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  slotProps={{
                    input: { style: { fontSize: 13 } },
                  }}
                />
              </Box>
            </Stack>
          </Paper>

          {/* Profile Progress */}
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
                sx={{ fontSize: 10, fontWeight: 600, height: 20, bgcolor: theme.palette.action.hover, color: theme.palette.text.secondary }}
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
                  <Typography variant="caption" sx={{ color: item.done ? theme.palette.status.active.main : theme.palette.text.disabled }}>
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

"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Divider,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Chip,
} from "@mui/material";
import {
  BusinessCenter as BusinessCenterIcon,
  AccountCircle as AccountCircleIcon,
  Person as PersonIcon,
  ImageOutlined as ImageIcon,
  LocationOn as LocationOnIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { z } from "zod";
import { passwordSchema, emailSchema } from "@/lib/validation/schemas";
import { createSupplier } from "@/api-clients/suppliers/suppliers";

// ─── MOCK DATA (replace with API fields when available) ───────────────────────
const MOCK_PLATFORM_ROLES = ["Supplier Admin", "Supplier Staff", "Supplier Viewer"];
const MOCK_COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Egypt", "Kuwait", "Qatar", "Bahrain", "Oman"];
const PHONE_COUNTRY_CODES = [
  { code: "+1", label: "+1" },
  { code: "+44", label: "+44" },
  { code: "+971", label: "+971" },
  { code: "+966", label: "+966" },
  { code: "+20", label: "+20" },
];
// ─────────────────────────────────────────────────────────────────────────────

// ─── MODULE-LEVEL CONSTANTS ───────────────────────────────────────────────────
const createSupplierSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine(v => /^[0-9+\s-]{8,15}$/.test(v), {
      message: "Invalid phone number",
    }),
  status: z.string(),
  companyName: z.string().min(1, "Company name is required"),
  commercialRegistrationNumber: z.string().min(1, "Commercial registration is required"),
  taxId: z.string().min(1, "Tax ID is required"),
});

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    bgcolor: "background.default",
    transition: "box-shadow 0.2s",
    "&:hover": {
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
    },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(var(--mui-palette-primary-mainChannel) / 0.12)",
    },
  },
  "& .MuiInputLabel-root": { fontWeight: 500 },
};

const cardSx = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: 2.5,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "var(--mui-shadows-1)",
  transition: "box-shadow 0.2s",
  "&:hover": { boxShadow: "var(--mui-shadows-3)" },
};
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
}: Readonly<{ icon: React.ReactNode; title: string; subtitle: string }>) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", mb: 2.5 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          background:
            "linear-gradient(135deg, rgba(var(--mui-palette-primary-mainChannel) / 0.12), rgba(var(--mui-palette-primary-mainChannel) / 0.06))",
          border: "1px solid",
          borderColor: "primary.light",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "primary.main",
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

// ─── ACTION PANEL ─────────────────────────────────────────────────────────────
interface ActionPanelProps {
  readonly inSidebar?: boolean;
  readonly allMandatoryFilled: boolean;
  readonly filledCount: number;
  readonly totalCount: number;
  readonly mandatoryFields: ReadonlyArray<{ readonly key: string; readonly label: string; readonly filled: boolean }>;
  readonly saving: boolean;
  readonly onSubmit: () => void;
  readonly onBack: () => void;
}

function ActionPanel({
  inSidebar = false,
  allMandatoryFilled,
  filledCount,
  totalCount,
  mandatoryFields,
  saving,
  onSubmit,
  onBack,
}: Readonly<ActionPanelProps>) {
  return (
    <Paper
      elevation={0}
      sx={
        inSidebar
          ? {
              ...cardSx,
              border: "1.5px solid",
              borderColor: allMandatoryFilled ? "success.light" : "divider",
              bgcolor: allMandatoryFilled ? "rgba(var(--mui-palette-success-mainChannel) / 0.03)" : "background.paper",
              transition: "border-color 0.3s, background-color 0.3s",
            }
          : {}
      }
    >
      {inSidebar && (
        <>
          {/* Progress indicator */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}
              >
                Form Progress
              </Typography>
              <Typography
                variant="caption"
                color={allMandatoryFilled ? "success.main" : "text.secondary"}
                sx={{ fontWeight: 700 }}
              >
                {filledCount}/{totalCount}
              </Typography>
            </Stack>
            {/* Progress bar */}
            <Box sx={{ height: 4, bgcolor: "divider", borderRadius: 99, overflow: "hidden" }}>
              <Box
                sx={{
                  height: "100%",
                  width: `${(filledCount / totalCount) * 100}%`,
                  bgcolor: allMandatoryFilled ? "success.main" : "primary.main",
                  borderRadius: 99,
                  transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s",
                }}
              />
            </Box>
            {/* Field chips */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              {mandatoryFields.map(f => (
                <Chip
                  key={f.key}
                  label={f.label}
                  size="small"
                  icon={f.filled ? <CheckCircleIcon style={{ fontSize: 12 }} /> : undefined}
                  sx={{
                    fontSize: 10,
                    height: 20,
                    fontWeight: f.filled ? 600 : 400,
                    bgcolor: f.filled ? "rgba(var(--mui-palette-success-mainChannel) / 0.1)" : "action.hover",
                    color: f.filled ? "success.dark" : "text.disabled",
                    border: "1px solid",
                    borderColor: f.filled ? "success.light" : "transparent",
                    "& .MuiChip-icon": { color: "success.main", ml: "4px" },
                    transition: "all 0.2s",
                  }}
                />
              ))}
            </Box>
          </Stack>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      <Stack spacing={1.5}>
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            onSubmit();
          }}
          disabled={saving}
          startIcon={saving ? undefined : <BusinessCenterIcon fontSize="small" />}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 0.5,
            py: inSidebar ? 1.25 : 0.9,
            textTransform: "uppercase",
            boxShadow: "0 2px 8px rgba(var(--mui-palette-primary-mainChannel) / 0.35)",
            "&:hover": {
              boxShadow: "0 4px 16px rgba(var(--mui-palette-primary-mainChannel) / 0.45)",
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "translateY(0)" },
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : "Create Supplier"}
        </Button>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            onBack();
          }}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 0.5,
            py: inSidebar ? 1 : 0.9,
            textTransform: "uppercase",
            color: "text.secondary",
            borderColor: "divider",
            "&:hover": { borderColor: "text.secondary", bgcolor: "action.hover" },
          }}
        >
          Cancel
        </Button>
      </Stack>
    </Paper>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ── STICKY FOOTER FOR MOBILE/TABLET ──────────────────────────────────────────
interface StickyFooterProps {
  readonly isMobile: boolean;
  readonly allMandatoryFilled: boolean;
  readonly filledCount: number;
  readonly totalCount: number;
  readonly saving: boolean;
  readonly onSubmit: () => void;
  readonly onBack: () => void;
}

function StickyFooter({
  isMobile,
  allMandatoryFilled,
  filledCount,
  totalCount,
  saving,
  onSubmit,
  onBack,
}: StickyFooterProps) {
  return isMobile ? (
    <Stack spacing={1}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        {allMandatoryFilled ? (
          <>
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 15 }} />
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
              All mandatory fields completed.
            </Typography>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {filledCount}/{totalCount} required fields filled.
          </Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onBack}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: 0.5,
            py: 0.9,
            textTransform: "uppercase",
            color: "text.secondary",
            borderColor: "divider",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={onSubmit}
          disabled={saving}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 0.5,
            py: 0.9,
            textTransform: "uppercase",
            boxShadow: "0 2px 8px rgba(var(--mui-palette-primary-mainChannel) / 0.35)",
          }}
        >
          {saving ? <CircularProgress size={17} color="inherit" /> : "Create Supplier"}
        </Button>
      </Stack>
    </Stack>
  ) : (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap" }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0, overflow: "hidden" }}>
        {allMandatoryFilled ? (
          <>
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 18, flexShrink: 0 }} />
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
              All mandatory fields completed.
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {filledCount}/{totalCount} required fields filled.
          </Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            px: { sm: 2, md: 3 },
            color: "text.secondary",
            borderColor: "divider",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={saving}
          startIcon={saving ? undefined : <BusinessCenterIcon fontSize="small" />}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            px: { sm: 2, md: 3 },
            boxShadow: "0 2px 8px rgba(var(--mui-palette-primary-mainChannel) / 0.35)",
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : "Create Supplier"}
        </Button>
      </Stack>
    </Stack>
  );
}

export default function CreateSupplierPage() {
  const router = useRouter();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  // ── MOCK STATE (wire to API when fields are available) ──
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [platformRole, setPlatformRole] = useState("Supplier Admin");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  // ─────────────────────────────────────────────────────────────

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    status: "active",
    companyName: "",
    commercialRegistrationNumber: "",
    taxId: "",
  });

  const handleLogoChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const mandatoryFields = [
    { key: "email", label: "Email", filled: Boolean(form.email) },
    { key: "password", label: "Password", filled: Boolean(form.password) },
    { key: "firstName", label: "First Name", filled: Boolean(form.firstName) },
    { key: "lastName", label: "Last Name", filled: Boolean(form.lastName) },
    { key: "phoneNumber", label: "Phone", filled: Boolean(form.phoneNumber) },
    { key: "companyName", label: "Company", filled: Boolean(form.companyName) },
    { key: "crn", label: "CRN", filled: Boolean(form.commercialRegistrationNumber) },
    { key: "taxId", label: "Tax ID", filled: Boolean(form.taxId) },
  ];

  const filledCount = mandatoryFields.filter(f => f.filled).length;
  const totalCount = mandatoryFields.length;
  const allMandatoryFilled = filledCount === totalCount;

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const result = createSupplierSchema.safeParse(form);
      if (!result.success) {
        const simplifiedErrors: Record<string, string | undefined> = {};
        result.error.issues.forEach(issue => {
          const key = issue.path[0] as string;
          if (!simplifiedErrors[key]) {
            simplifiedErrors[key] = issue.message;
          }
        });
        setFieldErrors(simplifiedErrors);
        return;
      }

      await createSupplier({
        ...form,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });

      router.push("/admin/suppliers");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Create supplier failed";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ pb: { xs: "108px", sm: "72px", lg: 4 } }}>
      {/* ── TOP BAR ── */}
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, sm: 3 },
          pb: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {/* Breadcrumb + Title */}
        <Box>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.75 }}>
            <Box
              onClick={() => {
                router.push("/admin/suppliers");
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
                transition: "color 0.15s",
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 14 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Suppliers
              </Typography>
            </Box>
            <Typography variant="body2" color="text.disabled">
              ›
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              Create New
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              Onboard Supplier
            </Typography>
            <Chip
              label="New"
              size="small"
              icon={<AutoAwesomeIcon style={{ fontSize: 11 }} />}
              color="primary"
              sx={{ fontSize: 10, height: 20, fontWeight: 700, letterSpacing: 0.5 }}
            />
          </Stack>
        </Box>
      </Box>

      {error && (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* ── MAIN LAYOUT ── */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={{ xs: 2, sm: 2.5, lg: 3 }}
          sx={{ alignItems: "flex-start" }}
        >
          {/* ── LEFT COLUMN ── */}
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Stack spacing={{ xs: 2, sm: 2.5 }}>
              {/* Company Profile */}
              <Paper elevation={0} sx={cardSx}>
                <SectionHeader
                  icon={<BusinessCenterIcon fontSize="small" />}
                  title="Company Profile"
                  subtitle="Official business registration details."
                />
                <Stack spacing={2}>
                  <TextField
                    label="Company Name"
                    fullWidth
                    value={form.companyName}
                    error={Boolean(fieldErrors.companyName)}
                    helperText={fieldErrors.companyName}
                    placeholder="e.g. Apex Logistics Rentals"
                    onChange={e => {
                      setForm({ ...form, companyName: e.target.value });
                    }}
                    sx={inputSx}
                    required
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Commercial Registration Number"
                      fullWidth
                      value={form.commercialRegistrationNumber}
                      error={Boolean(fieldErrors.commercialRegistrationNumber)}
                      helperText={fieldErrors.commercialRegistrationNumber}
                      placeholder="CRN-0000-0000"
                      onChange={e => {
                        setForm({ ...form, commercialRegistrationNumber: e.target.value });
                      }}
                      sx={inputSx}
                      required
                    />
                    <TextField
                      label="Tax Identification Number"
                      fullWidth
                      value={form.taxId}
                      error={Boolean(fieldErrors.taxId)}
                      helperText={fieldErrors.taxId}
                      placeholder="TAX-0000-0000"
                      onChange={e => {
                        setForm({ ...form, taxId: e.target.value });
                      }}
                      sx={inputSx}
                      required
                    />
                  </Stack>
                </Stack>
              </Paper>

              {/* Account Identity */}
              <Paper elevation={0} sx={cardSx}>
                <SectionHeader
                  icon={<AccountCircleIcon fontSize="small" />}
                  title="Account Identity"
                  subtitle="System access credentials."
                />
                <Stack spacing={2}>
                  {/* Row 1: Email + Password */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Primary Email Address"
                      fullWidth
                      value={form.email}
                      error={Boolean(fieldErrors.email)}
                      helperText={fieldErrors.email}
                      placeholder="admin@company.com"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Box component="span" sx={{ color: "text.disabled", fontSize: 18 }}>
                                ✉
                              </Box>
                            </InputAdornment>
                          ),
                        },
                      }}
                      onChange={e => {
                        setForm({ ...form, email: e.target.value });
                      }}
                      sx={inputSx}
                      required
                    />
                    <TextField
                      label="Temporary Password"
                      type="password"
                      fullWidth
                      value={form.password}
                      error={Boolean(fieldErrors.password)}
                      helperText={fieldErrors.password}
                      onChange={e => {
                        setForm({ ...form, password: e.target.value });
                      }}
                      sx={inputSx}
                      required
                    />
                  </Stack>

                  {/* Row 2: Platform Role + Status */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      select
                      label="Platform Role"
                      fullWidth
                      value={platformRole}
                      onChange={e => {
                        setPlatformRole(e.target.value);
                      }}
                      sx={inputSx}
                    >
                      {MOCK_PLATFORM_ROLES.map(r => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Status"
                      fullWidth
                      value={form.status}
                      error={Boolean(fieldErrors.status)}
                      onChange={e => {
                        setForm({ ...form, status: e.target.value });
                      }}
                      sx={inputSx}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="blocked">Blocked</MenuItem>
                    </TextField>
                  </Stack>
                </Stack>
              </Paper>

              {/* Representative Info */}
              <Paper elevation={0} sx={cardSx}>
                <SectionHeader
                  icon={<PersonIcon fontSize="small" />}
                  title="Representative Info"
                  subtitle="Primary contact person details."
                />
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="First Name"
                      fullWidth
                      value={form.firstName}
                      error={Boolean(fieldErrors.firstName)}
                      helperText={fieldErrors.firstName}
                      placeholder="Jane"
                      onChange={e => {
                        setForm({ ...form, firstName: e.target.value });
                      }}
                      sx={inputSx}
                      required
                    />
                    <TextField
                      label="Last Name"
                      fullWidth
                      value={form.lastName}
                      error={Boolean(fieldErrors.lastName)}
                      helperText={fieldErrors.lastName}
                      placeholder="Doe"
                      onChange={e => {
                        setForm({ ...form, lastName: e.target.value });
                      }}
                      sx={inputSx}
                      required
                    />
                  </Stack>
                  {/* MOCK: Phone with country code — wire country code to API when available */}
                  <TextField
                    label="Phone Number"
                    fullWidth
                    value={form.phoneNumber}
                    error={Boolean(fieldErrors.phoneNumber)}
                    helperText={fieldErrors.phoneNumber}
                    placeholder="(555) 123-4567"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <TextField
                              select
                              value={phoneCountryCode}
                              onChange={e => {
                                setPhoneCountryCode(e.target.value);
                              }}
                              variant="standard"
                              sx={{
                                minWidth: isMobile ? 52 : 58,
                                "& .MuiInput-underline:before": { borderBottom: "none" },
                                "& .MuiInput-underline:after": { borderBottom: "none" },
                                "& .MuiInput-underline:hover:before": { borderBottom: "none !important" },
                                "& .MuiSelect-select": { fontSize: isMobile ? 13 : 14 },
                              }}
                            >
                              {PHONE_COUNTRY_CODES.map(c => (
                                <MenuItem key={c.code} value={c.code}>
                                  {c.label}
                                </MenuItem>
                              ))}
                            </TextField>
                            <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    onChange={e => {
                      setForm({ ...form, phoneNumber: e.target.value });
                    }}
                    sx={inputSx}
                    required
                  />
                </Stack>
              </Paper>
            </Stack>
          </Box>

          {/* ── RIGHT SIDEBAR ── */}
          <Box sx={{ width: { xs: "100%", lg: 292 }, flexShrink: 0 }}>
            <Stack spacing={{ xs: 2, sm: 2.5 }}>
              {/* ── ACTION PANEL — Desktop only (top of sidebar) ── */}
              {isDesktop && (
                <ActionPanel
                  inSidebar
                  allMandatoryFilled={allMandatoryFilled}
                  filledCount={filledCount}
                  totalCount={totalCount}
                  mandatoryFields={mandatoryFields}
                  saving={saving}
                  onSubmit={() => {
                    void handleSubmit();
                  }}
                  onBack={() => {
                    router.back();
                  }}
                />
              )}

              {/* Branding — MOCK: Logo upload not yet in API */}
              <Paper elevation={0} sx={cardSx}>
                <SectionHeader
                  icon={<ImageIcon fontSize="small" />}
                  title="Branding"
                  subtitle="Company visual identity."
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: 12, fontWeight: 500 }}>
                  Company Logo
                </Typography>
                <Box
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const { files } = e.dataTransfer;
                    if (files.length > 0) {
                      handleLogoChange(files[0]);
                    }
                  }}
                  sx={{
                    border: "1.5px dashed",
                    borderColor: logoPreview ? "primary.light" : "divider",
                    borderRadius: 2,
                    height: { xs: 110, sm: 130 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    bgcolor: logoPreview ? "transparent" : "action.hover",
                    gap: 1,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 3px rgba(var(--mui-palette-primary-mainChannel) / 0.08)",
                    },
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {logoPreview ? (
                    <>
                      <Box
                        component="img"
                        src={logoPreview}
                        sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 6,
                          right: 6,
                          bgcolor: "background.paper",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          px: 0.75,
                          py: 0.25,
                        }}
                      >
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 600, fontSize: 10 }}>
                          Change
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          bgcolor: "background.paper",
                          border: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CloudUploadIcon sx={{ color: "text.disabled", fontSize: 22 }} />
                      </Box>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ textAlign: "center", fontWeight: 600, px: 1 }}
                      >
                        Click to upload or drag &amp; drop
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ textAlign: "center", px: 1, fontSize: 10 }}
                      >
                        SVG, PNG, JPG or GIF (max. 800×400px)
                      </Typography>
                    </>
                  )}
                </Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg,image/gif"
                  style={{ display: "none" }}
                  onChange={e => {
                    handleLogoChange(e.target.files?.[0] ?? null);
                  }}
                />
              </Paper>

              {/* Business Address — MOCK: country/city/street not in API yet */}
              <Paper elevation={0} sx={cardSx}>
                <SectionHeader
                  icon={<LocationOnIcon fontSize="small" />}
                  title="Business Address"
                  subtitle="Headquarters location."
                />
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Country"
                    fullWidth
                    value={country}
                    onChange={e => {
                      setCountry(e.target.value);
                    }}
                    sx={inputSx}
                    required
                  >
                    <MenuItem value="" disabled>
                      Select a country
                    </MenuItem>
                    {MOCK_COUNTRIES.map(c => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="City"
                    fullWidth
                    value={city}
                    onChange={e => {
                      setCity(e.target.value);
                    }}
                    placeholder="e.g. Dubai"
                    sx={inputSx}
                    required
                  />
                  <TextField
                    label="Street Address"
                    fullWidth
                    multiline
                    rows={2}
                    value={streetAddress}
                    onChange={e => {
                      setStreetAddress(e.target.value);
                    }}
                    placeholder="Building, Floor, Street..."
                    sx={inputSx}
                  />
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* ── STICKY FOOTER — Mobile & Tablet only (hidden on lg+) ── */}
      {!isDesktop && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 1.5, sm: 1.5 },
            backdropFilter: "blur(8px)",
          }}
        >
          <StickyFooter
            isMobile={isMobile}
            allMandatoryFilled={allMandatoryFilled}
            filledCount={filledCount}
            totalCount={totalCount}
            saving={saving}
            onSubmit={() => {
              void handleSubmit();
            }}
            onBack={() => {
              router.back();
            }}
          />
        </Box>
      )}
    </Box>
  );
}

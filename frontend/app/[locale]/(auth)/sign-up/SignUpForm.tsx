"use client";

import React, { useMemo, useState } from "react";
import { Link } from "@/shared/i18n/routing";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toApiUrl } from "@/utils/api-client";
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CheckCircle as CheckCircleIcon,
  DirectionsCar as CarIcon,
  Email as EmailIcon,
  ErrorOutlined as ErrorIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { signUpSchema, signUpFieldShape, type SignUpFormData, type SignUpRole } from "@/lib/validation/schemas";
import { z } from "zod";
import GoogleSignInButton from "../_components/GoogleSignInButton";
import RoleSelector from "./RoleSelector";

// ── password strength ──────────────────────────────────────────────────────────

interface PasswordStrength {
  score: number;
  label: string;
  color: "error" | "warning" | "info" | "success";
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "error" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[\W_]/.test(password)) score++;
  const levels: PasswordStrength[] = [
    { score: 1, label: "Weak", color: "error" },
    { score: 2, label: "Fair", color: "warning" },
    { score: 3, label: "Good", color: "info" },
    { score: 4, label: "Strong", color: "success" },
  ];
  return levels[score - 1] ?? { score: 0, label: "Too short", color: "error" };
}

interface RegistrationFormProps {
  readonly role: SignUpRole;
  readonly setRole: (v: SignUpRole) => void;
  readonly firstName: string;
  readonly setFirstName: (v: string) => void;
  readonly lastName: string;
  readonly setLastName: (v: string) => void;
  readonly email: string;
  readonly setEmail: (v: string) => void;
  readonly phone: string;
  readonly setPhone: (v: string) => void;
  readonly password: string;
  readonly setPassword: (v: string) => void;
  readonly confirmPassword: string;
  readonly setConfirmPassword: (v: string) => void;
  readonly showPassword: boolean;
  readonly setShowPassword: (v: boolean) => void;
  readonly showConfirmPassword: boolean;
  readonly setShowConfirmPassword: (v: boolean) => void;
  readonly acceptedTerms: boolean;
  readonly setAcceptedTerms: (v: boolean) => void;
  readonly acceptedPrivacy: boolean;
  readonly setAcceptedPrivacy: (v: boolean) => void;
  readonly isLoading: boolean;
  readonly fieldErrors: FieldErrors;
  readonly touched: TouchedFields;
  readonly handleRegister: (e: React.SyntheticEvent<HTMLFormElement>) => void | Promise<void>;
  readonly handleBlur: (field: keyof SignUpFormData) => void;
  readonly validateField: <K extends keyof SignUpFormData>(field: K, value: SignUpFormData[K]) => void;
  readonly passwordStrength: PasswordStrength;
  readonly canSubmit: boolean;
}

function RegistrationForm({
  role,
  setRole,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  acceptedTerms,
  setAcceptedTerms,
  acceptedPrivacy,
  setAcceptedPrivacy,
  isLoading,
  fieldErrors,
  touched,
  handleRegister,
  handleBlur,
  validateField,
  passwordStrength,
  canSubmit,
}: RegistrationFormProps) {
  const theme = useTheme();
  return (
    <Box
      component="form"
      onSubmit={(e: React.SyntheticEvent<HTMLFormElement>) => {
        void handleRegister(e);
      }}
      noValidate
    >
      {/* Role picker — selectable cards, Customer pre-selected. */}
      <RoleSelector value={role} onChange={setRole} disabled={isLoading} />

      {/* Name row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            id="firstName"
            name="firstName"
            label="First Name"
            required
            value={firstName}
            onChange={e => {
              setFirstName(e.target.value);
              if (touched.firstName) validateField("firstName", e.target.value);
            }}
            onBlur={() => {
              handleBlur("firstName");
            }}
            error={touched.firstName && !!fieldErrors.firstName}
            helperText={touched.firstName ? fieldErrors.firstName : undefined}
            autoComplete="given-name"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            id="lastName"
            name="lastName"
            label="Last Name"
            required
            value={lastName}
            onChange={e => {
              setLastName(e.target.value);
              if (touched.lastName) validateField("lastName", e.target.value);
            }}
            onBlur={() => {
              handleBlur("lastName");
            }}
            error={touched.lastName && !!fieldErrors.lastName}
            helperText={touched.lastName ? fieldErrors.lastName : undefined}
            autoComplete="family-name"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Email */}
      <TextField
        fullWidth
        id="email"
        name="email"
        label="Email Address"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={e => {
          setEmail(e.target.value);
          if (touched.email) validateField("email", e.target.value);
        }}
        onBlur={() => {
          handleBlur("email");
        }}
        error={touched.email && !!fieldErrors.email}
        helperText={touched.email ? fieldErrors.email : undefined}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      {/* Phone */}
      <TextField
        fullWidth
        id="phone"
        name="phone"
        label="Phone Number"
        type="tel"
        autoComplete="tel"
        required
        value={phone}
        onChange={e => {
          setPhone(e.target.value);
          if (touched.phone) validateField("phone", e.target.value);
        }}
        onBlur={() => {
          handleBlur("phone");
        }}
        error={touched.phone && !!fieldErrors.phone}
        helperText={touched.phone ? fieldErrors.phone : undefined}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      {/* Password */}
      <TextField
        fullWidth
        id="password"
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        required
        value={password}
        onChange={e => {
          setPassword(e.target.value);
          if (touched.password) validateField("password", e.target.value);
        }}
        onBlur={() => {
          handleBlur("password");
        }}
        error={touched.password && !!fieldErrors.password}
        helperText={touched.password ? fieldErrors.password : undefined}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: password ? 1 : 2 }}
      />

      {/* Password strength */}
      {password && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={(passwordStrength.score / 4) * 100}
            color={passwordStrength.color}
            sx={{ height: 4, borderRadius: 999, mb: 0.5 }}
          />
          <Typography variant="caption" color={`${passwordStrength.color}.main`} sx={{ fontWeight: 600 }}>
            {passwordStrength.label}
          </Typography>
        </Box>
      )}

      {/* Confirm Password */}
      <TextField
        fullWidth
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        type={showConfirmPassword ? "text" : "password"}
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={e => {
          setConfirmPassword(e.target.value);
          // Always re-validate confirmPassword in real time — spec
          // says "confirm password validation must work in real time
          // while typing", regardless of the touched flag.
          validateField("confirmPassword", e.target.value);
        }}
        onBlur={() => {
          handleBlur("confirmPassword");
        }}
        error={!!fieldErrors.confirmPassword && (touched.confirmPassword || confirmPassword.length > 0)}
        helperText={touched.confirmPassword || confirmPassword.length > 0 ? fieldErrors.confirmPassword : undefined}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => {
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      {/* Checkboxes */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedTerms}
              onChange={e => {
                setAcceptedTerms(e.target.checked);
                if (touched.acceptedTerms) validateField("acceptedTerms", e.target.checked as true);
              }}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              I accept the{" "}
              <MuiLink
                component={Link}
                href="/terms"
                sx={{ fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Terms of Service
              </MuiLink>
            </Typography>
          }
        />
        {touched.acceptedTerms && fieldErrors.acceptedTerms && (
          <FormHelperText error sx={{ ml: 4 }}>
            {fieldErrors.acceptedTerms}
          </FormHelperText>
        )}
        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedPrivacy}
              onChange={e => {
                setAcceptedPrivacy(e.target.checked);
                if (touched.acceptedPrivacy) validateField("acceptedPrivacy", e.target.checked as true);
              }}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              I accept the{" "}
              <MuiLink
                component={Link}
                href="/privacy"
                sx={{ fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Privacy Policy
              </MuiLink>
            </Typography>
          }
        />
        {touched.acceptedPrivacy && fieldErrors.acceptedPrivacy && (
          <FormHelperText error sx={{ ml: 4 }}>
            {fieldErrors.acceptedPrivacy}
          </FormHelperText>
        )}
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={!canSubmit}
        sx={{
          py: 1.75,
          fontSize: "1rem",
          fontWeight: 700,
          textTransform: "none",
          borderRadius: "999px",
          boxShadow: theme.palette.shadow.button,
          "&:hover": { boxShadow: theme.palette.shadow.buttonHover },
        }}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
      </Button>
    </Box>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

interface SignUpHeaderProps {
  readonly isSuccess: boolean;
}

function SignUpHeader({ isSuccess }: SignUpHeaderProps) {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main", boxShadow: theme.palette.shadow.button }}>
          <CarIcon sx={{ fontSize: 28 }} />
        </Avatar>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 900, letterSpacing: "-0.02em", color: "text.primary" }}
        >
          ARES
        </Typography>
      </Box>
      {!isSuccess && (
        <>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
            Create an account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join us and start your premium rental experience today.
          </Typography>
        </>
      )}
    </Box>
  );
}

interface SuccessViewProps {
  readonly firstName: string;
  readonly email: string;
  readonly callbackUrl?: string | null;
}

function SuccessView({ firstName, email: _email, callbackUrl }: SuccessViewProps) {
  const signInHref = callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in";

  return (
    <Box
      sx={{
        textAlign: "center",
        p: 4,
        borderRadius: 2,
        bgcolor: "success.light",
        border: "1px solid",
        borderColor: "success.main",
      }}
    >
      <Avatar sx={{ width: 64, height: 64, bgcolor: "success.main", mx: "auto", mb: 2 }}>
        <CheckCircleIcon sx={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: "bold" }} gutterBottom>
        Check your email!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Welcome to ARES, {firstName}. We&apos;ve sent a verification link to your email. Please click the link to verify
        your account before logging in.
      </Typography>
      <Button
        component={Link}
        href={signInHref}
        variant="contained"
        fullWidth
        size="large"
        sx={{ borderRadius: "999px", py: 1.75, fontWeight: 700, textTransform: "none" }}
      >
        Go to Sign In
      </Button>
    </Box>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

interface PayloadInputs {
  readonly role: SignUpRole;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly acceptedTerms: boolean;
  readonly acceptedPrivacy: boolean;
}

function getSignUpPayload(inputs: PayloadInputs): SignUpFormData {
  return {
    role: inputs.role,
    firstName: inputs.firstName,
    lastName: inputs.lastName,
    email: inputs.email,
    phone: inputs.phone,
    password: inputs.password,
    confirmPassword: inputs.confirmPassword,
    acceptedTerms: inputs.acceptedTerms as true,
    acceptedPrivacy: inputs.acceptedPrivacy as true,
  };
}

function processSignUpResult(
  result: z.ZodSafeParseResult<SignUpFormData>
): { success: true; data: SignUpFormData } | { success: false; errors: FieldErrors } {
  if (result.success) return { success: true, data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof SignUpFormData;
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

async function handleRegisterResponse(response: Response): Promise<void> {
  if (response.ok) return;

  if (response.status === 409) {
    throw new Error("This email is already registered. Try signing in instead.");
  }
  if (response.status === 429) {
    throw new Error("Too many registration attempts. Please try again later.");
  }
  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as {
      validationErrors?: { message: string }[];
      message?: string;
    } | null;
    const first = body?.validationErrors?.[0]?.message ?? body?.message;
    throw new Error(first ?? "Invalid details. Please check your inputs.");
  }
  throw new Error("An unexpected error occurred. Please try again.");
}

async function performRegistration(payload: SignUpFormData): Promise<void> {
  // The backend `RegisterRequest` has both the legacy fields and the new
  // optional Phone / ConfirmPassword / Role. We forward all of them; the
  // backend validator handles the cross-field rules.
  const response = await fetch(toApiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      role: payload.role,
      acceptedTerms: payload.acceptedTerms,
      acceptedPrivacy: payload.acceptedPrivacy,
    }),
  });

  await handleRegisterResponse(response);
}

// ── component ──────────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<keyof SignUpFormData, string>>;
type TouchedFields = Partial<Record<keyof SignUpFormData, boolean>>;

export default function SignUpForm() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [role, setRole] = useState<SignUpRole>("customer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const passwordStrength = getPasswordStrength(password);

  const validateField = <K extends keyof SignUpFormData>(field: K, value: SignUpFormData[K]) => {
    // Special-case the confirmPassword field — the underlying schema
    // only checks "is a non-empty string", so we layer the cross-field
    // "must match password" check here for real-time feedback as the
    // user types.
    if (field === "confirmPassword") {
      const stringValue = typeof value === "string" ? value : "";
      if (stringValue.length === 0) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "Please confirm your password" }));
        return;
      }
      if (stringValue !== password) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
        return;
      }
      setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
      return;
    }

    // All other fields delegate to the per-field shape so we never pay
    // the price of evaluating the full cross-field refinement.
    const fieldSchema = signUpFieldShape[field];
    const result = fieldSchema.safeParse(value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const handleBlur = (field: keyof SignUpFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const values = getSignUpPayload({
      role,
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      acceptedTerms,
      acceptedPrivacy,
    });
    validateField(field, values[field]);
  };

  const validateForm = (payload: SignUpFormData) => {
    const validation = processSignUpResult(signUpSchema.safeParse(payload));
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setTouched({
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        password: true,
        confirmPassword: true,
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      return false;
    }
    return true;
  };

  const executeRegistration = async (payload: SignUpFormData) => {
    setIsLoading(true);
    setServerError("");
    try {
      await performRegistration(payload);
      setIsSuccess(true);
    } catch (error: unknown) {
      setServerError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = getSignUpPayload({
      role,
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      acceptedTerms,
      acceptedPrivacy,
    });
    if (validateForm(payload)) {
      await executeRegistration(payload);
    }
  };

  // Whole-form validity (used to enable/disable the submit button). We
  // run the cross-field zod schema so the "passwords match" check is
  // honoured exactly as on submit — the submit button stays disabled
  // until everything passes.
  const isFormValid = useMemo(() => {
    const payload = getSignUpPayload({
      role,
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      acceptedTerms,
      acceptedPrivacy,
    });
    return signUpSchema.safeParse(payload).success;
  }, [role, firstName, lastName, email, phone, password, confirmPassword, acceptedTerms, acceptedPrivacy]);

  const canSubmit = !isLoading && isFormValid;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", background: theme.palette.overlay.gradient }}>
      <Box sx={{ display: "flex", flex: 1, flexDirection: { xs: "column", lg: "row" } }}>
        {/* ── Form side ── */}
        <Box
          sx={{
            flex: { xs: "1 1 auto", lg: "0 0 50%" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2, sm: 4, lg: 8 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 520,
              mx: "auto",
              bgcolor: "background.paper",
              borderRadius: "24px",
              p: { xs: 4, sm: 6 },
              boxShadow: theme.palette.shadow.card,
              border: `1px solid ${theme.palette.border.main}`,
            }}
          >
            {/* Logo */}
            <SignUpHeader isSuccess={isSuccess} />

            {/* ── Success ── */}
            {isSuccess ? (
              <SuccessView firstName={firstName} email={email} callbackUrl={callbackUrl} />
            ) : (
              <>
                {serverError && (
                  <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
                    {serverError}
                  </Alert>
                )}

                <RegistrationForm
                  role={role}
                  setRole={setRole}
                  firstName={firstName}
                  setFirstName={setFirstName}
                  lastName={lastName}
                  setLastName={setLastName}
                  email={email}
                  setEmail={setEmail}
                  phone={phone}
                  setPhone={setPhone}
                  password={password}
                  setPassword={setPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  acceptedTerms={acceptedTerms}
                  setAcceptedTerms={setAcceptedTerms}
                  acceptedPrivacy={acceptedPrivacy}
                  setAcceptedPrivacy={setAcceptedPrivacy}
                  isLoading={isLoading}
                  fieldErrors={fieldErrors}
                  touched={touched}
                  handleRegister={handleRegister}
                  handleBlur={handleBlur}
                  validateField={validateField}
                  passwordStrength={passwordStrength}
                  canSubmit={canSubmit}
                />

                {/* ── Google sign-up ─────────────────────────────────── */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 3 }}>
                  <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                  >
                    or
                  </Typography>
                  <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
                </Box>
                <GoogleSignInButton
                  disabled={isLoading}
                  initialRole={role === "driver" ? "Driver" : role === "supplier" ? "Supplier" : "Customer"}
                  onError={message => {
                    setServerError(message);
                  }}
                />

                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                  Already have an account?{" "}
                  <MuiLink
                    component={Link}
                    href="/sign-in"
                    sx={{ fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                  >
                    Sign in
                  </MuiLink>
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {/* ── Decorative side ── */}
        {!isMobile && (
          <Box sx={{ flex: { lg: "0 0 50%" }, position: "relative", display: { xs: "none", lg: "block" } }}>
            <Paper
              elevation={0}
              sx={{ position: "relative", height: "100%", borderRadius: 0, overflow: "hidden", bgcolor: "transparent" }}
            >
              <Box sx={{ position: "absolute", inset: 0, "& img": { objectFit: "cover", opacity: 0.6 } }}>
                <Image
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt="Luxury Car Fleet"
                  fill
                  sizes="50vw"
                  priority
                />
              </Box>
              <Box sx={{ position: "absolute", inset: 0, background: theme.palette.overlay.tealGradient }} />
              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 6, color: "common.white" }}>
                <Typography variant="h3" component="h3" sx={{ fontWeight: 900, mb: 2, letterSpacing: "-0.02em" }}>
                  Your Journey Begins Here
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ maxWidth: 500, color: "text.secondary", fontWeight: 400, lineHeight: 1.6 }}
                >
                  Join thousands of satisfied customers and gain access to the most exclusive vehicle fleet in the
                  region.
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

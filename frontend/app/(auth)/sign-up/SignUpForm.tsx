"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ErrorOutline as ErrorIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { signUpSchema, type SignUpFormData } from "@/lib/validation/schemas";
import { z } from "zod";

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
  readonly firstName: string;
  readonly setFirstName: (v: string) => void;
  readonly lastName: string;
  readonly setLastName: (v: string) => void;
  readonly email: string;
  readonly setEmail: (v: string) => void;
  readonly password: string;
  readonly setPassword: (v: string) => void;
  readonly showPassword: boolean;
  readonly setShowPassword: (v: boolean) => void;
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
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
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
          <Typography variant="caption" color={`${passwordStrength.color}.main`} fontWeight={600}>
            {passwordStrength.label}
          </Typography>
        </Box>
      )}

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
}

function SuccessView({ firstName, email }: SuccessViewProps) {
  return (
    <Box
      sx={{
        textAlign: "center",
        p: 4,
        borderRadius: 3,
        bgcolor: "success.light",
        border: "1px solid",
        borderColor: "success.main",
      }}
    >
      <Avatar sx={{ width: 64, height: 64, bgcolor: "success.main", mx: "auto", mb: 2 }}>
        <CheckCircleIcon sx={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Account Created!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Welcome to ARES, {firstName}. We&apos;ve sent a verification link to <strong>{email}</strong>.
      </Typography>
      <Button
        component={Link}
        href="/sign-in"
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

function getSignUpPayload(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  acceptedTerms: boolean,
  acceptedPrivacy: boolean
): SignUpFormData {
  return {
    firstName,
    lastName,
    email,
    password,
    acceptedTerms: acceptedTerms as true,
    acceptedPrivacy: acceptedPrivacy as true,
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
  const response = await fetch(toApiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await handleRegisterResponse(response);
}

// ── component ──────────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<keyof SignUpFormData, string>>;
type TouchedFields = Partial<Record<keyof SignUpFormData, boolean>>;

export default function SignUpForm() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const passwordStrength = getPasswordStrength(password);

  const validateField = <K extends keyof SignUpFormData>(field: K, value: SignUpFormData[K]) => {
    const result = signUpSchema.shape[field].safeParse(value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const handleBlur = (field: keyof SignUpFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const values = getSignUpPayload(firstName, lastName, email, password, acceptedTerms, acceptedPrivacy);
    validateField(field, values[field]);
  };

  const validateForm = (payload: SignUpFormData) => {
    const validation = processSignUpResult(signUpSchema.safeParse(payload));
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        password: true,
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
    const payload = getSignUpPayload(firstName, lastName, email, password, acceptedTerms, acceptedPrivacy);
    if (validateForm(payload)) {
      await executeRegistration(payload);
    }
  };

  const canSubmit =
    !isLoading &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    email.trim() !== "" &&
    password.trim() !== "" &&
    acceptedTerms &&
    acceptedPrivacy;

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
              <SuccessView firstName={firstName} email={email} />
            ) : (
              <>
                {serverError && (
                  <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
                    {serverError}
                  </Alert>
                )}

                <RegistrationForm
                  firstName={firstName}
                  setFirstName={setFirstName}
                  lastName={lastName}
                  setLastName={setLastName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
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
              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 6, color: "white" }}>
                <Typography variant="h3" component="h3" sx={{ fontWeight: 900, mb: 2, letterSpacing: "-0.02em" }}>
                  Your Journey Begins Here
                </Typography>
                <Typography variant="h6" sx={{ maxWidth: 500, color: "grey.300", fontWeight: 400, lineHeight: 1.6 }}>
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

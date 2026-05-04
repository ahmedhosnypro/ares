"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn, getSession } from "next-auth/react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Email as EmailIcon,
  ErrorOutlined as ErrorIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { signInSchema, type SignInFormData } from "@/lib/validation/schemas";
import { logger } from "@/utils/logger";

type FieldErrors = Partial<Record<keyof SignInFormData, string>>;

export default function SignInForm() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayConnected, setStayConnected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignInFormData, boolean>>>({});

  const validateField = (field: keyof SignInFormData, value: string) => {
    const result = signInSchema.shape[field].safeParse(value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const handleBlur = (field: keyof SignInFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, field === "email" ? email : password);
  };

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");

    // Full Zod parse on submit
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SignInFormData;
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setTouched({ email: true, password: true });
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        stayConnected: stayConnected.toString(),
      });

      if (res?.error) {
        setServerError(res.error);
        logger.error("Login error:", res.error);
      } else if (res?.ok) {
        // Fetch session to determine roles
        const session = await getSession();
        if (session?.user.roles.includes("Admin") || session?.user.roles.includes("Supplier")) {
          router.push("/admin");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch (error) {
      setServerError("An unexpected error occurred. Please try again.");
      logger.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = !isLoading && email.length > 0 && password.length > 0;

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
              maxWidth: 480,
              mx: "auto",
              bgcolor: "background.paper",
              borderRadius: "24px",
              p: { xs: 4, sm: 6 },
              boxShadow: theme.palette.shadow.card,
              border: `1px solid ${theme.palette.border.main}`,
            }}
          >
            {/* Logo */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 4 }}>
                <Box sx={{ position: "relative", width: 200, height: 60, display: "flex", alignItems: "center" }}>
                  <Image
                    src="/img/favicon/logo_transparent.png"
                    alt="Ares Logo"
                    fill
                    sizes="200px"
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </Box>
              </Box>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please enter your details to sign in to your account.
              </Typography>
            </Box>

            {serverError && (
              <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
                {serverError}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={(e: React.SyntheticEvent<HTMLFormElement>) => {
                void handleLogin(e);
              }}
              noValidate
            >
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

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={stayConnected}
                      onChange={e => {
                        setStayConnected(e.target.checked);
                      }}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      Stay connected
                    </Typography>
                  }
                />
                <MuiLink
                  component={Link}
                  href="/forgot-password"
                  variant="body2"
                  sx={{ fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  Forgot password?
                </MuiLink>
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
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign in"}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              Don&apos;t have an account?{" "}
              <MuiLink
                component={Link}
                href="/register"
                sx={{ fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Create a free account
              </MuiLink>
            </Typography>
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
                  alt="Luxury Car"
                  fill
                  sizes="50vw"
                  priority
                />
              </Box>
              <Box sx={{ position: "absolute", inset: 0, background: theme.palette.overlay.tealGradient }} />
              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 6, color: "common.white" }}>
                <Typography variant="h3" component="h3" sx={{ fontWeight: 900, mb: 2, letterSpacing: "-0.02em" }}>
                  Drive Your Ambition
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ maxWidth: 500, color: "text.secondary", fontWeight: 400, lineHeight: 1.6 }}
                >
                  Experience the ultimate driving journey with our collection of top-tier vehicles, tailored just for
                  you.
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

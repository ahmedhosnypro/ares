"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  AlertTitle,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayConnected, setStayConnected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        stayConnected: stayConnected.toString(),
      });

      if (res?.error) {
        setErrorMessage(res.error);
      } else if (res?.ok) {
        router.push("/account/profile");
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #f4f6f8 0%, rgba(15, 91, 91, 0.05) 100%)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        {/* Left Side: Login Form */}
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
              bgcolor: "#ffffff",
              borderRadius: "24px",
              p: { xs: 4, sm: 6 },
              boxShadow: "0 24px 60px rgba(15, 91, 91, 0.12)",
              border: "1px solid rgba(15, 91, 91, 0.1)",
            }}
          >
            {/* Logo & Header */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 4 }}>
                <Box
                  sx={{
                    position: "relative",
                    width: 200,
                    height: 60,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Image
                    src="/img/favicon/logo_transparent.png"
                    alt="Ares Logo"
                    fill
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </Box>
              </Box>

              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: "text.primary",
                }}
              >
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please enter your details to sign in to your account.
              </Typography>
            </Box>

            {/* Error Message */}
            {errorMessage && (
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    width: "100%",
                  },
                }}
              >
                <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
                {errorMessage}
              </Alert>
            )}

            {/* Form */}
            <Box
              component="form"
              onSubmit={(e: React.SyntheticEvent<HTMLFormElement>) => {
                void handleLogin(e);
              }}
              noValidate
            >
              {/* Email Field */}
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
                }}
                placeholder="name@example.com"
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

              {/* Password Field */}
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
                }}
                placeholder="••••••••"
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

              {/* Remember Me & Forgot Password */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
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
                  sx={{
                    fontWeight: 600,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Forgot password?
                </MuiLink>
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !email || !password}
                sx={{
                  py: 1.75,
                  fontSize: "1rem",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "999px",
                  boxShadow: "0 8px 16px rgba(15, 91, 91, 0.3)",
                  "&:hover": {
                    boxShadow: "0 12px 20px rgba(15, 91, 91, 0.4)",
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Sign in to account"
                )}
              </Button>
            </Box>

            {/* Sign Up Link */}
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 4 }}
            >
              Don&apos;t have an account?{" "}
              <MuiLink
                component={Link}
                href="/register"
                sx={{
                  fontWeight: 700,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Create a free account
              </MuiLink>
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Decorative Image */}
        {!isMobile && (
          <Box
            sx={{
              flex: { lg: "0 0 50%" },
              position: "relative",
              display: { xs: "none", lg: "block" },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                position: "relative",
                height: "100%",
                borderRadius: 0,
                overflow: "hidden",
                bgcolor: "transparent",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  "& img": {
                    objectFit: "cover",
                    opacity: 0.6,
                  },
                }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt="Luxury Car"
                  fill
                  sizes="50vw"
                  priority
                />
              </Box>

              {/* Teal to Dark Gradient Overlay */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(15, 91, 91, 0.85) 0%, rgba(16, 33, 43, 0.90) 100%)",
                }}
              />

              {/* Text Content */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 6,
                  color: "white",
                }}
              >
                <Typography
                  variant="h3"
                  component="h3"
                  sx={{
                    fontWeight: 900,
                    mb: 2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Drive Your Ambition
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    maxWidth: 500,
                    color: "grey.300",
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  Experience the ultimate driving journey with our collection of
                  top-tier vehicles, tailored just for you.
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

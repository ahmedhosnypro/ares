"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toApiUrl } from "@/src/utils/api-client";
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
  Avatar,
  CircularProgress,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  DirectionsCar as CarIcon,
  ErrorOutline as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

export default function RegisterPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  // States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!acceptedTerms || !acceptedPrivacy) {
      setErrorMessage("You must accept both the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(toApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          acceptedTerms,
          acceptedPrivacy,
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Invalid details. Please ensure your email is correct and your password is strong.");
        } else if (response.status === 409) {
          throw new Error("This email is already registered. Try signing in instead.");
        } else if (response.status === 429) {
          throw new Error("Too many registration attempts. Please try again later.");
        } else {
          throw new Error("An unexpected error occurred. Please try again.");
        }
      }

      setIsSuccess(true);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
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
        {/* Left Side: Registration Form */}
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
              bgcolor: "#ffffff",
              borderRadius: "24px",
              p: { xs: 4, sm: 6 },
              boxShadow: "0 24px 60px rgba(15, 91, 91, 0.12)",
              border: "1px solid rgba(15, 91, 91, 0.1)",
            }}
          >
            {/* Logo & Header */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "primary.main",
                    boxShadow: "0 8px 16px rgba(15, 91, 91, 0.3)",
                  }}
                >
                  <CarIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "text.primary",
                  }}
                >
                  ARES
                </Typography>
              </Box>

              {!isSuccess && (
                <>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: "text.primary",
                    }}
                  >
                    Create an account
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Join us and start your premium rental experience today.
                  </Typography>
                </>
              )}
            </Box>

            {/* Success Screen */}
            {isSuccess ? (
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
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: "success.main",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Account Created!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Welcome to ARES, {firstName}. Your account has been successfully created. We&apos;ve sent a
                  verification link to <strong>{email}</strong>.
                </Typography>
                <Button
                  component={Link}
                  href="/sign-in"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{
                    borderRadius: "999px",
                    py: 1.75,
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  Go to Sign In
                </Button>
              </Box>
            ) : (
              <>
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
                    void handleRegister(e);
                  }}
                  noValidate
                >
                  {/* First Name & Last Name */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        id="firstName"
                        name="firstName"
                        label="First Name"
                        type="text"
                        required
                        value={firstName}
                        onChange={e => {
                          setFirstName(e.target.value);
                        }}
                        placeholder="John"
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
                        type="text"
                        required
                        value={lastName}
                        onChange={e => {
                          setLastName(e.target.value);
                        }}
                        placeholder="Doe"
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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                    }}
                    placeholder="Create a strong password"
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

                  {/* Terms & Privacy Checkboxes */}
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptedTerms}
                          onChange={e => {
                            setAcceptedTerms(e.target.checked);
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
                            sx={{
                              fontWeight: 700,
                              textDecoration: "none",
                              "&:hover": {
                                textDecoration: "underline",
                              },
                            }}
                          >
                            Terms of Service
                          </MuiLink>
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptedPrivacy}
                          onChange={e => {
                            setAcceptedPrivacy(e.target.checked);
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
                            sx={{
                              fontWeight: 700,
                              textDecoration: "none",
                              "&:hover": {
                                textDecoration: "underline",
                              },
                            }}
                          >
                            Privacy Policy
                          </MuiLink>
                        </Typography>
                      }
                    />
                  </Box>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={
                      isLoading || !email || !password || !firstName || !lastName || !acceptedTerms || !acceptedPrivacy
                    }
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
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
                  </Button>
                </Box>

                {/* Sign In Link */}
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                  Already have an account?{" "}
                  <MuiLink
                    component={Link}
                    href="/sign-in"
                    sx={{
                      fontWeight: 700,
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Sign in
                  </MuiLink>
                </Typography>
              </>
            )}
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
                  alt="Luxury Car Fleet"
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
                  Your Journey Begins Here
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

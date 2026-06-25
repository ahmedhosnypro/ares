"use client";

import { useEffect } from "react";
import { Box, Typography, Button, Container, useTheme, alpha } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import { logger } from "@/utils/logger";

/**
 * Global Error Boundary page.
 *
 * Catches runtime exceptions and displays a user-friendly error state with
 * themed styling that respects light/dark modes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  const theme = useTheme();

  useEffect(() => {
    // Log the error using the central logger
    logger.error("Global Error Boundary caught an exception:", error);
  }, [error]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        color: "text.primary",
        py: 8,
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          {/* Visual Indicator */}
          <Box
            sx={{
              position: "relative",
              width: 140,
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.error.main, 0.05),
              mb: 2,
            }}
          >
            <ErrorOutlinedIcon sx={{ fontSize: 72, color: "error.main", opacity: 0.8 }} />
          </Box>

          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: "auto", fontWeight: 500 }}>
              An unexpected error occurred while processing your request. Our team has been notified and we are working
              to resolve it.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                reset();
              }}
              startIcon={<RefreshIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                bgcolor: "error.main",
                boxShadow: theme.palette.shadow.button,
                "&:hover": {
                  bgcolor: "error.dark",
                  boxShadow: theme.palette.shadow.buttonHover,
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s",
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              href="/"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s",
              }}
            >
              Go to Homepage
            </Button>
          </Box>

          {error.digest && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 2, fontFamily: "monospace" }}>
              Error ID: {error.digest}
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
}

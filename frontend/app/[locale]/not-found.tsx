"use client";

import Link from "next/link";
import { Box, Typography, Button, Container, useTheme, alpha } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";

/**
 * Global 404 Not Found page.
 *
 * Implements themed background and text colors to prevent "white on white"
 * issues in light mode, following AGENTS.md rules.
 */
export default function NotFound() {
  const theme = useTheme();

  return (
    <Box
      component="main"
      sx={theme => ({
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: 8,
      })}
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
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              mb: 2,
            }}
          >
            <SearchIcon sx={{ fontSize: 72, color: "text.disabled", opacity: 0.3 }} />
            <Box
              sx={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 40,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: theme.palette.shadow.card,
                border: "1px solid",
                borderColor: theme.palette.border.light,
                transform: "rotate(-12deg) translate(30px, 30px)",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: "primary.main",
                  lineHeight: 1,
                }}
              >
                404
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
              Page not found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: "auto", fontWeight: 500 }}>
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mt: 2 }}>
            <Button
              variant="contained"
              component={Link}
              href="/"
              startIcon={<HomeIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                boxShadow: theme.palette.shadow.button,
                "&:hover": {
                  boxShadow: theme.palette.shadow.buttonHover,
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s",
              }}
            >
              Back to Home
            </Button>
            <Button
              variant="outlined"
              component={Link}
              href="/search"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s",
              }}
            >
              Search Vehicles
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

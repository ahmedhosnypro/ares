"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { Box, Typography, Button, Container, useTheme, alpha } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";

export default function NotFound() {
  const theme = useTheme();
  const t = useTranslations("rootPages.notFound");

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
                {t("errorCode")}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
              {t("title")}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: "auto", fontWeight: 500 }}>
              {t("description")}
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
              {t("backToHome")}
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
              {t("searchVehicles")}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

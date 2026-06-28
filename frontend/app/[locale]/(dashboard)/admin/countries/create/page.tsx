"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  IconButton,
  Stack,
  Card,
  CardContent,
  TextField,
  Divider,
  Button,
  CircularProgress,
  useTheme,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";
import SaveIcon from "@mui/icons-material/SaveRounded";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { createCountry, validateCountry } from "@/api-clients/countries/countries";
import { logger } from "@/utils/logger";

export default function AdminCreateCountryPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.createCountry");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nameEn: "",
    nameAr: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    nameEn: "",
    nameAr: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setFieldErrors(prev => ({
      ...prev,
      [name]: "",
    }));
    setError(null);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    void (async () => {
      if (!session?.accessToken) return;

      let hasError = false;
      const errors = { nameEn: "", nameAr: "" };

      if (!formData.nameEn.trim()) {
        errors.nameEn = t("form.validation.nameEnRequired");
        hasError = true;
      }
      if (!formData.nameAr.trim()) {
        errors.nameAr = t("form.validation.nameArRequired");
        hasError = true;
      }

      if (hasError) {
        setFieldErrors(errors);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Validate English name uniqueness
        const isEnUnique = await validateCountry(session.accessToken, "en", formData.nameEn.trim());
        if (!isEnUnique) {
          setFieldErrors(prev => ({
            ...prev,
            nameEn: t("form.validation.nameUniqueError"),
          }));
          setLoading(false);
          return;
        }

        // Validate Arabic name uniqueness
        const isArUnique = await validateCountry(session.accessToken, "ar", formData.nameAr.trim());
        if (!isArUnique) {
          setFieldErrors(prev => ({
            ...prev,
            nameAr: t("form.validation.nameUniqueError"),
          }));
          setLoading(false);
          return;
        }

        // Create payload
        const payload = {
          values: [
            { language: "en", name: formData.nameEn.trim() },
            { language: "ar", name: formData.nameAr.trim() },
          ],
        };

        await createCountry(session.accessToken, payload);
        router.push("/admin/countries");
      } catch (err: unknown) {
        logger.error("Failed to create country", err);
        const errMessage = err instanceof Error ? err.message : t("alerts.error");
        setError(errMessage);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <Box sx={{ pb: 6, minHeight: "100vh" }}>
      <Container maxWidth="md">
        {/* Header section with back button */}
        <Stack direction="row" sx={{ alignItems: "center", mb: 4, mt: 3 }}>
          <Link href="/admin/countries" passHref style={{ textDecoration: "none" }}>
            <Tooltip title={t("backButtonTooltip")}>
              <IconButton
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: theme.palette.shadow.card,
                  mr: 2,
                  color: "text.primary",
                  border: `1px solid ${theme.palette.border.main}`,
                  "&:hover": {
                    bgcolor: "background.paper",
                    transform: "translateX(-3px)",
                  },
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Link>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
            {t("title")}
          </Typography>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.palette.shadow.card,
              bgcolor: "background.paper",
              border: `1px solid ${theme.palette.border.main}`,
              overflow: "hidden",
            }}
          >
            {/* Elegant Header Accent */}
            <Box
              sx={{
                height: 6,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                    {t("cardTitle")}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label={t("form.fields.nameEn")}
                    name="nameEn"
                    value={formData.nameEn}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading}
                    placeholder={t("form.fields.placeholderEn")}
                    error={Boolean(fieldErrors.nameEn)}
                    helperText={fieldErrors.nameEn}
                    slotProps={{
                      input: {
                        sx: { borderRadius: 2 },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label={t("form.fields.nameAr")}
                    name="nameAr"
                    value={formData.nameAr}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading}
                    placeholder={t("form.fields.placeholderAr")}
                    error={Boolean(fieldErrors.nameAr)}
                    helperText={fieldErrors.nameAr}
                    slotProps={{
                      input: {
                        sx: { borderRadius: 2 },
                      },
                    }}
                  />
                </Grid>

                {error && (
                  <Grid size={{ xs: 12 }}>
                    <Typography color="error" variant="body2" sx={{ fontWeight: 600 }}>
                      {error}
                    </Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                    <Link href="/admin/countries" passHref style={{ textDecoration: "none" }}>
                      <Button
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          fontWeight: 600,
                        }}
                      >
                        {t("form.buttons.cancel")}
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading || !formData.nameEn.trim() || !formData.nameAr.trim()}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1,
                        fontWeight: 700,
                        boxShadow: theme.palette.shadow.button,
                        "&:hover": {
                          boxShadow: theme.palette.shadow.buttonHover,
                        },
                      }}
                    >
                      {loading ? t("form.buttons.submitting") : t("form.buttons.submit")}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </form>
      </Container>
    </Box>
  );
}

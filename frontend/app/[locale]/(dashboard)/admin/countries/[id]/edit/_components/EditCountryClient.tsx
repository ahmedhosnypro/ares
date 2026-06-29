"use client";

import React, { useState, useEffect } from "react";
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
import { getCountryDetails, updateCountry, validateCountry } from "@/api-clients/countries/countries";
import { logger } from "@/utils/logger";

interface EditCountryClientProps {
  readonly countryId: string;
}

export default function EditCountryClient({ countryId }: EditCountryClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.editCountry");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialNames, setInitialNames] = useState({
    nameEn: "",
    nameAr: "",
  });

  const [formData, setFormData] = useState({
    nameEn: "",
    nameAr: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    nameEn: "",
    nameAr: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!session?.accessToken || !countryId) return;
      setLoading(true);
      setError(null);
      try {
        const [enData, arData] = await Promise.all([
          getCountryDetails(session.accessToken, countryId, "en"),
          getCountryDetails(session.accessToken, countryId, "ar"),
        ]);
        const names = {
          nameEn: enData.name || "",
          nameAr: arData.name || "",
        };
        setInitialNames(names);
        setFormData(names);
      } catch (err: unknown) {
        logger.error("Failed to load country details", err);
        setError(t("alerts.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [countryId, session?.accessToken, t]);

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
      if (!session?.accessToken || !countryId) return;

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
        setSaving(true);
        setError(null);

        // Validate English name uniqueness if it changed
        if (formData.nameEn.trim() !== initialNames.nameEn) {
          const isEnUnique = await validateCountry(session.accessToken, "en", formData.nameEn.trim());
          if (!isEnUnique) {
            setFieldErrors(prev => ({
              ...prev,
              nameEn: t("form.validation.nameUniqueError"),
            }));
            setSaving(false);
            return;
          }
        }

        // Validate Arabic name uniqueness if it changed
        if (formData.nameAr.trim() !== initialNames.nameAr) {
          const isArUnique = await validateCountry(session.accessToken, "ar", formData.nameAr.trim());
          if (!isArUnique) {
            setFieldErrors(prev => ({
              ...prev,
              nameAr: t("form.validation.nameUniqueError"),
            }));
            setSaving(false);
            return;
          }
        }

        // Create payload
        const payload = {
          values: [
            { language: "en", name: formData.nameEn.trim() },
            { language: "ar", name: formData.nameAr.trim() },
          ],
        };

        await updateCountry(session.accessToken, countryId, payload);
        router.push(`/admin/countries/${countryId}`);
      } catch (err: unknown) {
        logger.error("Failed to update country", err);
        const errMessage = err instanceof Error ? err.message : t("alerts.error");
        setError(errMessage);
      } finally {
        setSaving(false);
      }
    })();
  };

  const isDirty = formData.nameEn !== initialNames.nameEn || formData.nameAr !== initialNames.nameAr;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10, minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, minHeight: "100vh" }}>
      <Container maxWidth="md">
        {/* Header section with back button */}
        <Stack direction="row" sx={{ alignItems: "center", mb: 4, mt: 3 }}>
          <Link href={`/admin/countries/${countryId}`} passHref style={{ textDecoration: "none" }}>
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
                    disabled={saving}
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
                    disabled={saving}
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
                    <Link href={`/admin/countries/${countryId}`} passHref style={{ textDecoration: "none" }}>
                      <Button
                        variant="outlined"
                        color="inherit"
                        disabled={saving}
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
                      disabled={saving || !isDirty || !formData.nameEn.trim() || !formData.nameAr.trim()}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
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
                      {saving ? t("form.buttons.submitting") : t("form.buttons.submit")}
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

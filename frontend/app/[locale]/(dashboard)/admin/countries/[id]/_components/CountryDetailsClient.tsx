"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  IconButton,
  Stack,
  Card,
  CardContent,
  Divider,
  Button,
  CircularProgress,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";
import EditIcon from "@mui/icons-material/EditRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import PublicIcon from "@mui/icons-material/PublicTwoTone";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { getCountryDetails, checkCountry, deleteCountry, type CountryDetail } from "@/api-clients/countries/countries";
import { logger } from "@/utils/logger";

interface CountryDetailsClientProps {
  readonly countryId: string;
}

export default function CountryDetailsClient({ countryId }: CountryDetailsClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const locale = useLocale();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.countryDetails");

  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<CountryDetail | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── FLAG CONFIGURATION ──
  const [countryCodes, setCountryCodes] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("https://flagcdn.com/en/codes.json")
      .then(res => res.json())
      .then((data: Record<string, string>) => {
        const reversed = Object.entries(data).reduce<Record<string, string>>((acc, [code, name]) => {
          acc[name.toLowerCase()] = code;
          return acc;
        }, {});
        reversed["usa"] = "us";
        reversed["uk"] = "gb";
        reversed["uae"] = "ae";
        setCountryCodes(reversed);
      })
      .catch((_err: unknown) => {
        // Fallback silently
      });
  }, []);

  const flagCode = useMemo(() => {
    if (!country?.name) return null;
    return countryCodes[country.name.toLowerCase()] || null;
  }, [country, countryCodes]);

  const loadData = useCallback(async () => {
    if (!session?.accessToken || !countryId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getCountryDetails(session.accessToken, countryId, locale);
      setCountry(data);
    } catch (err: unknown) {
      logger.error("Failed to load country details", err);
      setErrorMsg(t("alerts.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [countryId, session?.accessToken, locale, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDeleteClick = useCallback(async () => {
    if (!session?.accessToken || !countryId) return;

    try {
      const { canDelete, message } = await checkCountry(session.accessToken, countryId);
      if (!canDelete) {
        setErrorMsg(message || t("alerts.cannotDelete"));
        return;
      }
      setOpenDelete(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("alerts.checkError");
      setErrorMsg(message);
    }
  }, [session, countryId, t]);

  const confirmDelete = useCallback(async () => {
    if (!countryId || !session?.accessToken) return;
    try {
      await deleteCountry(session.accessToken, countryId);
      setSuccessMsg(t("alerts.deleteSuccess"));
      setOpenDelete(false);
      router.push("/admin/countries");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("alerts.deleteError");
      setErrorMsg(message);
    }
  }, [countryId, session, router, t]);

  const handleCloseDelete = useCallback(() => setOpenDelete(false), []);
  const handleCloseError = useCallback(() => setErrorMsg(null), []);
  const handleCloseSuccess = useCallback(() => setSuccessMsg(null), []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10, minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!country) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{t("alerts.notFound")}</Alert>
        <Button
          sx={{ mt: 2, borderRadius: 2 }}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/admin/countries")}
        >
          {t("backButtonTooltip")}
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: 6, minHeight: "100vh" }}>
      <Container maxWidth="md">
        {/* Header section with back button */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4, mt: 3 }}
        >
          <Stack direction="row" sx={{ alignItems: "center" }}>
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

          <Stack direction="row" spacing={1.5}>
            <Link href={`/admin/countries/${countryId}/edit`} passHref style={{ textDecoration: "none" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  boxShadow: theme.palette.shadow.button,
                  "&:hover": {
                    boxShadow: theme.palette.shadow.buttonHover,
                  },
                }}
              >
                {t("actions.edit")}
              </Button>
            </Link>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteClick}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
              }}
            >
              {t("actions.delete")}
            </Button>
          </Stack>
        </Stack>

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

              {/* Flag View */}
              <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 80,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: `1px solid ${theme.palette.border.main}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: theme.palette.shadow.card,
                  }}
                >
                  {flagCode ? (
                    <Box
                      component="img"
                      src={`https://flagcdn.com/w160/${flagCode}.png`}
                      alt={country.name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <PublicIcon sx={{ fontSize: 48, color: "primary.main" }} />
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t("idLabel")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, wordBreak: "break-all" }}>
                      {country._id}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t("nameLabel")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {country.name}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1, minWidth: 350 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("deleteDialog.title")}</DialogTitle>
        <DialogContent>
          {t("deleteDialog.description")}
          <br />
          <strong>{t("deleteDialog.notice")}</strong>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} variant="outlined" sx={{ borderRadius: 2 }}>
            {t("deleteDialog.cancel")}
          </Button>
          <Button
            onClick={() => {
              void confirmDelete();
            }}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {t("deleteDialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ERROR SNACKBAR */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" onClose={handleCloseError}>
          {errorMsg}
        </Alert>
      </Snackbar>

      {/* SUCCESS SNACKBAR */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" onClose={handleCloseSuccess}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

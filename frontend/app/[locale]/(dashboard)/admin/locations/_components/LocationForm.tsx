"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControlLabel,
  Grid,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { useRouter } from "@/shared/i18n/routing";
import { toImageUrl } from "@/utils/image-url";
import { type LocationFormData, useLocationFormApi } from "./useLocationFormApi";

interface LocationFormProps {
  readonly mode: "create" | "edit";
  readonly locationId?: string;
}

export default function LocationForm({ mode, locationId }: LocationFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.locationsForm");
  const tc = useTranslations("common");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<LocationFormData>({
    userId: session?.user.id || "00000000-0000-0000-0000-000000000000",
    addressLine: "",
    city: "",
    governorate: "",
    country: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    isPrimary: false,
  });

  const { loading, fetching, fetchLocation, submitForm } = useLocationFormApi({
    mode,
    accessToken: session?.accessToken,
    locationId,
    onSuccess: message => {
      setSuccessMsg(message);
      setTimeout(() => {
        router.push("/admin/locations");
      }, 1500);
    },
    onError: message => {
      setErrorMsg(message);
    },
    onLoadError: message => {
      setErrorMsg(message);
    },
    successMessage: mode === "create" ? t("createSuccessMessage") : t("editSuccessMessage"),
    errorMessage: mode === "create" ? t("createErrorMessage") : t("editErrorMessage"),
    loadErrorMessage: t("loadError"),
    imageUploadFailedMessage: t("imageUploadFailed"),
  });

  const imageRemovedRef = useRef(false);

  useEffect(() => {
    if (mode !== "edit" || !session?.accessToken || !locationId) return;
    if (imageRemovedRef.current) return;

    let cancelled = false;

    void fetchLocation().then(data => {
      if (cancelled || !data) return;
      setFormData({
        userId: data.userId || session.user.id || "",
        addressLine: data.addressLine || "",
        city: data.city || "",
        governorate: data.governorate || "",
        country: data.country || "",
        postalCode: data.postalCode || "",
        latitude: data.latitude ? String(data.latitude) : "",
        longitude: data.longitude ? String(data.longitude) : "",
        isPrimary: data.isPrimary || false,
      });
      if (data.imageUrl) {
        setImagePreview(toImageUrl(data.imageUrl) ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mode, session?.accessToken, session?.user.id, locationId, fetchLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const userId = session?.user.id || formData.userId;
    await submitForm(formData, userId, imageFile);
  };

  if (fetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 800, mx: "auto" }}>
      <Stack direction="row" sx={{ alignItems: "center", mb: 4 }} spacing={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            router.push("/admin/locations");
          }}
          color="inherit"
          sx={{ borderRadius: 2 }}
        >
          {tc("back")}
        </Button>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <LocationOnIcon fontSize="large" color="primary" />
          {mode === "create" ? t("createTitle") : t("editTitle")}
        </Typography>
      </Stack>

      <Card
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          elevation: 0,
        }}
      >
        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t("cardTitle")}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t("nameLabel")}
                name="addressLine"
                value={formData.addressLine}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t("cityLabel")}
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t("governorateLabel")}
                name="governorate"
                value={formData.governorate}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t("countryLabel")}
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t("postalCodeLabel")}
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t("coordinatesTitle")}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t("latitudeLabel")}
                name="latitude"
                type="number"
                slotProps={{ htmlInput: { step: "any" } }}
                value={formData.latitude}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t("longitudeLabel")}
                name="longitude"
                type="number"
                slotProps={{ htmlInput: { step: "any" } }}
                value={formData.longitude}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <ImageUploadField
                imageFile={imageFile}
                imagePreview={imagePreview}
                onImageChange={(file, preview) => {
                  if (!file && !preview) imageRemovedRef.current = true;
                  setImageFile(file);
                  setImagePreview(preview);
                }}
                onError={message => {
                  setErrorMsg(message || null);
                }}
                disabled={loading}
                sectionTitle={t("imageSectionTitle")}
                previewAlt={t("imagePreviewAlt")}
                changeImageLabel={t("changeImage")}
                removeImageLabel={t("removeImage")}
                clickToUploadLabel={t("clickToUpload")}
                uploadFormatHintLabel={t("uploadFormatHint")}
                invalidTypeMessage={t("invalidImageType")}
                sizeExceedsMessage={t("imageSizeExceeds")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch checked={formData.isPrimary} onChange={handleChange} name="isPrimary" color="primary" />
                }
                label={t("primaryLocationSwitch")}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Stack direction="row" sx={{ justifyContent: "flex-end" }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    router.push("/admin/locations");
                  }}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {tc("cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : mode === "create" ? (
                    t("createBtn")
                  ) : (
                    t("saveChanges")
                  )}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Card>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => {
          setErrorMsg(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="error"
          onClose={() => {
            setErrorMsg(null);
          }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => {
          setSuccessMsg(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          onClose={() => {
            setSuccessMsg(null);
          }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

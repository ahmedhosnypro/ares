"use client";

import { useState, useRef, ChangeEvent, SyntheticEvent } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  Grid,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { createLocationWithImage, createLocation } from "@/api-clients/locations/locations";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Image from "next/image";

export default function AdminCreateLocationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected image file and local preview URL
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    userId: session?.user.id || "00000000-0000-0000-0000-000000000000",
    addressLine: "",
    city: "",
    governorate: "",
    country: "Egypt",
    postalCode: "",
    latitude: "",
    longitude: "",
    isPrimary: false,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    // Create a local object URL for the preview
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!session?.accessToken) {
      setErrorMsg("Unauthorized. Please log in.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        ...formData,
        userId: session.user.id,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (imageFile) {
        // Send as multipart/form-data — backend must accept `image` file field
        await createLocationWithImage(session.accessToken, payload, imageFile);
      } else {
        // No image selected — fall back to JSON request without image
        await createLocation(session.accessToken, payload);
      }

      setSuccessMsg("Location created successfully");
      setTimeout(() => {
        router.push("/admin/locations");
      }, 1500);
    } catch (err: unknown) {
      let message = "Failed to create location";
      if (err instanceof Error) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

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
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <LocationOnIcon fontSize="large" color="primary" />
          Create Location
        </Typography>
      </Stack>

      <Card sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, border: "1px solid", borderColor: "divider", elevation: 0 }}>
        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Location Details
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Location Name / Address Line"
                name="addressLine"
                value={formData.addressLine}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Governorate / State"
                name="governorate"
                value={formData.governorate}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Coordinates &amp; Media
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Latitude"
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
                label="Longitude"
                name="longitude"
                type="number"
                slotProps={{ htmlInput: { step: "any" } }}
                value={formData.longitude}
                onChange={handleChange}
              />
            </Grid>

            {/* Image Upload */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Location Image
              </Typography>

              {/* Hidden native file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />

              {imagePreview ? (
                <Box>
                  {/* Preview */}
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: 220,
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: "divider",
                      mb: 1,
                    }}
                  >
                    <Image src={imagePreview} alt="Location preview" fill style={{ objectFit: "cover" }} />
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      Change Image
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={handleRemoveImage}>
                      Remove
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  sx={{
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 40, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    Click to upload an image
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    PNG, JPG, WEBP up to 10 MB
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch checked={formData.isPrimary} onChange={handleChange} name="isPrimary" color="primary" />
                }
                label="Set as Primary Location"
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Create Location"}
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

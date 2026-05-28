"use client";

import { useEffect, useState, ChangeEvent, useRef } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  CircularProgress,
  MenuItem,
  InputAdornment,
  Alert,
  IconButton,
  alpha,
  useTheme,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { updateCar, getCarById, uploadCarImage } from "@/api-clients/cars/cars";
import { createCarSchema } from "../../create/page";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function EditCarPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: 2024,
    color: "",
    licensePlate: "",
    transmission: "Automatic",
    fuelType: "Gasoline",
    seats: 4,
    pricePerDay: 0,
    locationCity: "",
    description: "",
    status: "Active",
    availabilityStatus: "Available",
    imageUrl: "",
  });

  // Load car data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCarById(session?.accessToken ?? "", id);

        // Merge the retrieved data into the form structure
        setForm(prev => ({
          ...prev,
          ...data,
          imageUrl: data.imageUrl || "",
        }));

        if (data.imageUrl) {
          setFilePreview(data.imageUrl);
        }
      } catch {
        setApiError("Failed to load car data");
      } finally {
        setLoadingData(false);
      }
    };

    if (session?.accessToken && id) {
      void fetchData();
    }
  }, [session?.accessToken, id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ["year", "seats", "pricePerDay"].includes(name) ? Number(value) : value,
    }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size exceeds 10MB limit.");
      return;
    }

    setFileError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(form.imageUrl || null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    void (async () => {
      const result = createCarSchema.safeParse(form);

      if (!result.success) {
        const simplified: Record<string, string | undefined> = {};
        result.error.issues.forEach(issue => {
          const key = issue.path[0] as string;
          if (!simplified[key]) {
            simplified[key] = issue.message;
          }
        });

        setFieldErrors(simplified);
        return;
      }

      if (fileError) return;

      if (!session?.accessToken || !session.user.id) {
        setApiError("You must be logged in to update a vehicle");
        return;
      }

      try {
        setLoading(true);
        setApiError("");

        let finalImageUrl = form.imageUrl;

        // 1. Upload image if selected
        if (selectedFile) {
          const uploadRes = await uploadCarImage(session.accessToken, id, selectedFile);
          finalImageUrl = uploadRes.url;
        }

        await updateCar(session.accessToken, id, {
          ...form,
          imageUrl: finalImageUrl,
          userId: session.user.id,
        });

        router.push("/admin/vehicles");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error updating car";
        setApiError(msg);
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loadingData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      <Stack sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Edit Vehicle
        </Typography>
        <Typography color="text.secondary">Update vehicle information</Typography>
      </Stack>

      <Card sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Grid container spacing={3}>
          {/* Identity */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Make (Brand)"
              name="make"
              value={form.make}
              onChange={handleChange}
              error={!!fieldErrors.make}
              helperText={fieldErrors.make}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Model"
              name="model"
              value={form.model}
              onChange={handleChange}
              error={!!fieldErrors.model}
              helperText={fieldErrors.model}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Year"
              name="year"
              value={form.year}
              onChange={handleChange}
              error={!!fieldErrors.year}
              helperText={fieldErrors.year}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Color"
              name="color"
              value={form.color}
              onChange={handleChange}
              error={!!fieldErrors.color}
              helperText={fieldErrors.color}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="License Plate"
              name="licensePlate"
              value={form.licensePlate}
              onChange={handleChange}
              error={!!fieldErrors.licensePlate}
              helperText={fieldErrors.licensePlate}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Transmission"
              name="transmission"
              value={form.transmission}
              onChange={handleChange}
            >
              <MenuItem value="Automatic">Automatic</MenuItem>
              <MenuItem value="Manual">Manual</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Fuel Type" name="fuelType" value={form.fuelType} onChange={handleChange}>
              <MenuItem value="Gasoline">Gasoline</MenuItem>
              <MenuItem value="Diesel">Diesel</MenuItem>
              <MenuItem value="Electric">Electric</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth type="number" label="Seats" name="seats" value={form.seats} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Price Per Day"
              name="pricePerDay"
              value={form.pricePerDay}
              onChange={handleChange}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="City" name="locationCity" value={form.locationCity} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </Grid>

          {/* Image Upload */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "text.secondary" }}>
              Vehicle Image
            </Typography>
            <Box
              sx={{
                p: 3,
                border: "2px dashed",
                borderColor: fileError ? "error.main" : "divider",
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                textAlign: "center",
                cursor: loading ? "default" : "pointer",
                "&:hover": {
                  borderColor: loading ? "divider" : "primary.main",
                  bgcolor: loading
                    ? alpha(theme.palette.background.paper, 0.4)
                    : alpha(theme.palette.primary.main, 0.02),
                },
              }}
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
                disabled={loading}
              />

              {filePreview ? (
                <Box sx={{ position: "relative", display: "inline-block" }}>
                  <Box
                    component="img"
                    src={filePreview}
                    alt="Preview"
                    sx={{
                      maxHeight: 240,
                      maxWidth: "100%",
                      borderRadius: 2,
                      display: "block",
                      boxShadow: theme.shadows[3],
                    }}
                  />
                  {!loading && (
                    <IconButton
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: alpha(theme.palette.error.main, 0.9),
                        color: "white",
                        "&:hover": { bgcolor: theme.palette.error.main },
                      }}
                      size="small"
                    >
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ) : (
                <Stack spacing={1} sx={{ alignItems: "center" }}>
                  <CloudUploadIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Click to upload vehicle image
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG or WebP (max 10MB)
                  </Typography>
                </Stack>
              )}
            </Box>
            {fileError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                {fileError}
              </Typography>
            )}
          </Grid>
        </Grid>

        {apiError && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {apiError}
          </Alert>
        )}

        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 5 }}>
          <Button
            onClick={() => {
              router.push("/admin/vehicles");
            }}
            variant="outlined"
          >
            Cancel
          </Button>

          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Update Vehicle"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}

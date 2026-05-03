"use client";

import React, { useState, useEffect } from "react";
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
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getLocationById, updateLocation } from "@/app/api/locations/locations";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export default function AdminEditLocationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    userId: session?.user?.id || "00000000-0000-0000-0000-000000000000",
    addressLine: "",
    city: "",
    governorate: "",
    country: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    isPrimary: false,
    imageUrl: "",
  });

  useEffect(() => {
    if (!session?.accessToken || !id) return;

    const fetchLocation = async () => {
      try {
        const data = await getLocationById(session.accessToken, id);
        setFormData({
          userId: data.userId || session.user?.id || "00000000-0000-0000-0000-000000000000",
          addressLine: data.addressLine || "",
          city: data.city || "",
          governorate: data.governorate || "",
          country: data.country || "",
          postalCode: data.postalCode || "",
          latitude: data.latitude ? String(data.latitude) : "",
          longitude: data.longitude ? String(data.longitude) : "",
          isPrimary: data.isPrimary || false,
          imageUrl: data.imageUrl || "",
        });
      } catch (err: any) {
        setErrorMsg("Failed to load location details");
      } finally {
        setFetching(false);
      }
    };

    fetchLocation();
  }, [id, session?.accessToken, session?.user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        userId: formData.userId || session.user?.id || "00000000-0000-0000-0000-000000000000",
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };
      
      await updateLocation(session.accessToken, id, payload);
      setSuccessMsg("Location updated successfully");
      setTimeout(() => {
        router.push("/admin/locations");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to update location");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 800, mx: "auto" }}>
      <Stack direction="row" alignItems="center" mb={4} spacing={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/admin/locations")}
          color="inherit"
          sx={{ borderRadius: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocationOnIcon fontSize="large" color="primary" />
          Edit Location
        </Typography>
      </Stack>

      <Card sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, border: "1px solid", borderColor: "divider", elevation: 0 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={700} mb={1}>Location Details</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Name / Address Line"
                name="addressLine"
                value={formData.addressLine}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Governorate / State"
                name="governorate"
                value={formData.governorate}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} mt={2}>
              <Typography variant="h6" fontWeight={700} mb={1}>Coordinates & Media</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Latitude"
                name="latitude"
                type="number"
                inputProps={{ step: "any" }}
                value={formData.latitude}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Longitude"
                name="longitude"
                type="number"
                inputProps={{ step: "any" }}
                value={formData.longitude}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPrimary}
                    onChange={handleChange}
                    name="isPrimary"
                    color="primary"
                  />
                }
                label="Set as Primary Location"
              />
            </Grid>

            <Grid item xs={12} mt={2}>
              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => router.push("/admin/locations")}
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Card>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>
      </Snackbar>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}

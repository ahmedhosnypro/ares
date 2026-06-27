"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Checkbox,
  ListItemText,
  Select,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  DirectionsCar as DirectionsCarIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface ServiceArea {
  id: string;
  name: string;
  governorate: string;
  isActive: boolean;
}

export default function CompleteProfileClient() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const t = useTranslations("dashboard.driverCompleteProfile");

  const [isLoading, setIsLoading] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);

  // Form state
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

  // Files state
  const [licenseImage, setLicenseImage] = useState<File | null>(null);
  const [idFrontImage, setIdFrontImage] = useState<File | null>(null);
  const [idBackImage, setIdBackImage] = useState<File | null>(null);

  const [error, setError] = useState("");

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch(toApiUrl("/api/service-areas"));
        if (res.ok) {
          const data = (await res.json()) as ServiceArea[];
          setServiceAreas(data.filter((a: ServiceArea) => a.isActive));
        }
      } catch (err) {
        logger.error("Failed to fetch service areas", err);
      } finally {
        setIsLoadingAreas(false);
      }
    };
    void fetchAreas();
  }, []);

  const handleAreaChange = (event: SelectChangeEvent<typeof selectedAreaIds>) => {
    const {
      target: { value },
    } = event;
    setSelectedAreaIds(typeof value === "string" ? value.split(",") : value);
  };

  const handleFileChange =
    (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setter(file);
      }
    };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!session?.accessToken) return;

    if (!licenseImage || !idFrontImage || !idBackImage) {
      setError(t("errors.pleaseUploadAllRequiredDocuments"));
      return;
    }

    if (selectedAreaIds.length === 0) {
      setError(t("errors.pleaseSelectAtLeastOneWorkArea"));
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("LicenseNumber", licenseNumber);
      formData.append("LicenseExpiryDate", licenseExpiryDate);
      formData.append("Address", address);
      formData.append("EmergencyContactName", emergencyName);
      formData.append("EmergencyContactPhone", emergencyPhone);

      selectedAreaIds.forEach(id => {
        formData.append("ServiceAreaIds", id);
      });

      formData.append("LicenseImage", licenseImage);
      formData.append("NationalIdFrontImage", idFrontImage);
      formData.append("NationalIdBackImage", idBackImage);

      const res = await fetch(toApiUrl("/api/driver/profile/complete"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({ message: undefined }))) as { message?: string };
        throw new Error(data.message ?? t("errors.failedToCompleteProfile"));
      }

      await update(); // refresh session
      router.push("/driver/verification-status");
    } catch (err) {
      logger.error("Profile completion error", err);
      setError(err instanceof Error ? err.message : t("errors.anUnexpectedErrorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  const renderFileUploader = (
    label: string,
    file: File | null,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    ref: React.RefObject<HTMLInputElement | null>
  ) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {label} *
      </Typography>
      <input type="file" accept="image/*" style={{ display: "none" }} ref={ref} onChange={handleFileChange(setter)} />
      {file ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderColor: "success.main",
            bgcolor: "success.light",
          }}
        >
          <Typography variant="body2" sx={{ color: "success.dark", fontWeight: 500 }} noWrap>
            {file.name}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setter(null);
            }}
            color="success"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      ) : (
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          startIcon={<CloudUploadIcon />}
          onClick={() => ref.current?.click()}
          sx={{ p: 3, borderStyle: "dashed", borderWidth: 2 }}
        >
          {t("uploadImage")}
        </Button>
      )}
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, boxShadow: theme.palette.shadow.card }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              display: "inline-flex",
              p: 2,
              borderRadius: "50%",
              bgcolor: "primary.light",
              color: "primary.main",
              mb: 2,
            }}
          >
            <DirectionsCarIcon fontSize="large" />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
            {t("title")}
          </Typography>
          <Typography color="text.secondary">{t("subtitle")}</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
        >
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                {t("personalDetails")}
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label={t("address")}
                  required
                  value={address}
                  onChange={e => {
                    setAddress(e.target.value);
                  }}
                />
                <TextField
                  fullWidth
                  label={t("emergencyContactName")}
                  required
                  value={emergencyName}
                  onChange={e => {
                    setEmergencyName(e.target.value);
                  }}
                />
                <TextField
                  fullWidth
                  label={t("emergencyContactPhone")}
                  required
                  value={emergencyPhone}
                  onChange={e => {
                    setEmergencyPhone(e.target.value);
                  }}
                />
              </Stack>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mt: 4 }}>
                {t("workAreas")}
              </Typography>
              <FormControl fullWidth required>
                <InputLabel id="areas-label">{t("selectServiceAreas")}</InputLabel>
                <Select
                  labelId="areas-label"
                  multiple
                  value={selectedAreaIds}
                  onChange={handleAreaChange}
                  renderValue={selected =>
                    serviceAreas
                      .filter(a => selected.includes(a.id))
                      .map(a => a.name)
                      .join(", ")
                  }
                  label={t("selectServiceAreas")}
                >
                  {isLoadingAreas ? (
                    <MenuItem disabled>{t("loadingAreas")}</MenuItem>
                  ) : (
                    serviceAreas.map(area => (
                      <MenuItem key={area.id} value={area.id}>
                        <Checkbox checked={selectedAreaIds.includes(area.id)} />
                        <ListItemText primary={area.name} secondary={area.governorate} />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                {t("licenseAndDocuments")}
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label={t("licenseNumber")}
                  required
                  value={licenseNumber}
                  onChange={e => {
                    setLicenseNumber(e.target.value);
                  }}
                />
                <TextField
                  fullWidth
                  label={t("licenseExpiryDate")}
                  type="date"
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={licenseExpiryDate}
                  onChange={e => {
                    setLicenseExpiryDate(e.target.value);
                  }}
                />
                <Box>
                  {renderFileUploader(t("driverLicenseImage"), licenseImage, setLicenseImage, licenseInputRef)}
                  {renderFileUploader(t("nationalIdFront"), idFrontImage, setIdFrontImage, idFrontInputRef)}
                  {renderFileUploader(t("nationalIdBack"), idBackImage, setIdBackImage, idBackInputRef)}
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ px: 6, py: 1.5, borderRadius: 2, fontWeight: 700 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : t("submitProfile")}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

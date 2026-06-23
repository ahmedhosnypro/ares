"use client";

import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress, Divider, Grid, TextField, Typography } from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CountrySelect from "@/components/input/CountrySelect";
import { addressSchema, type AddressFormData } from "@/lib/validation/schemas";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface AddressFormProps {
  readonly userId: string;
  readonly accessToken: string;
  readonly addressStreet: string;
  readonly addressCity: string;
  readonly addressState: string;
  readonly addressPostalCode: string;
  readonly addressCountry: string;
  readonly emergencyName: string;
  readonly emergencyPhone: string;
  readonly emergencyRelationship: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly dateOfBirth?: string;
  readonly languagePreference: string;
  readonly currencyPreference: string;
}

type FieldErrors = Partial<Record<keyof AddressFormData, string>>;

export default function AddressForm({
  userId,
  accessToken,
  addressStreet: initialStreet,
  addressCity: initialCity,
  addressState: initialState,
  addressPostalCode: initialPostalCode,
  addressCountry: initialCountry,
  emergencyName: initialEmergencyName,
  emergencyPhone: initialEmergencyPhone,
  emergencyRelationship: initialEmergencyRelationship,
  firstName,
  lastName,
  phone,
  dateOfBirth,
  languagePreference,
  currencyPreference,
}: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AddressFormData, boolean>>>({});

  const [street, setStreet] = useState(initialStreet);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [country, setCountry] = useState(initialCountry);
  const [emergencyName, setEmergencyName] = useState(initialEmergencyName);
  const [emergencyPhone, setEmergencyPhone] = useState(initialEmergencyPhone);
  const [emergencyRelationship, setEmergencyRelationship] = useState(initialEmergencyRelationship);

  const validateField = (field: keyof AddressFormData, value: string) => {
    const result = addressSchema.shape[field].safeParse(value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const handleBlur = (field: keyof AddressFormData, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleEmergencyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setEmergencyPhone(raw);
    if (touched.emergencyPhone) validateField("emergencyPhone", raw);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg("");
    setServerError("");

    const payload: AddressFormData = {
      street,
      city,
      state,
      postalCode,
      country,
      emergencyName,
      emergencyPhone,
      emergencyRelationship,
    };
    const result = addressSchema.safeParse(payload);

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof AddressFormData;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setTouched({
        street: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        emergencyName: true,
        emergencyPhone: true,
        emergencyRelationship: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(toApiUrl(`/api/users/${userId}/profile`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          dateOfBirth: dateOfBirth ?? null,
          languagePreference,
          currencyPreference,
          address: { street, city, state, postalCode, country },
          emergencyContact: { name: emergencyName, phone: emergencyPhone, relationship: emergencyRelationship },
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          validationErrors?: { message: string }[];
          message?: string;
        } | null;
        const msg = body?.validationErrors?.[0]?.message ?? body?.message ?? "Failed to update";
        throw new Error(msg);
      }
      setSuccessMsg("Address saved successfully.");
    } catch (error) {
      logger.error("Address update error", error);
      setServerError(error instanceof Error ? error.message : "Failed to save address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
        Address & Emergency Contact
      </Typography>
      <Divider sx={{ mb: 3, borderColor: "border.light" }} />

      <Box
        component="form"
        onSubmit={e => {
          void handleSubmit(e);
        }}
        noValidate
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              id="street"
              label="Street Address"
              value={street}
              onChange={e => {
                setStreet(e.target.value);
                if (touched.street) validateField("street", e.target.value);
              }}
              onBlur={() => {
                handleBlur("street", street);
              }}
              error={touched.street && !!fieldErrors.street}
              helperText={touched.street ? fieldErrors.street : undefined}
              autoComplete="street-address"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="city"
              label="City"
              value={city}
              onChange={e => {
                setCity(e.target.value);
                if (touched.city) validateField("city", e.target.value);
              }}
              onBlur={() => {
                handleBlur("city", city);
              }}
              error={touched.city && !!fieldErrors.city}
              helperText={touched.city ? fieldErrors.city : undefined}
              autoComplete="address-level2"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="state"
              label="State / Governorate"
              value={state}
              onChange={e => {
                setState(e.target.value);
                if (touched.state) validateField("state", e.target.value);
              }}
              onBlur={() => {
                handleBlur("state", state);
              }}
              error={touched.state && !!fieldErrors.state}
              helperText={touched.state ? fieldErrors.state : undefined}
              autoComplete="address-level1"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="postalCode"
              label="Postal Code"
              value={postalCode}
              onChange={e => {
                setPostalCode(e.target.value);
                if (touched.postalCode) validateField("postalCode", e.target.value);
              }}
              onBlur={() => {
                handleBlur("postalCode", postalCode);
              }}
              error={touched.postalCode && !!fieldErrors.postalCode}
              helperText={touched.postalCode ? fieldErrors.postalCode : undefined}
              autoComplete="postal-code"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <CountrySelect
              id="country"
              value={country}
              onChange={v => {
                setCountry(v);
                if (touched.country) validateField("country", v);
              }}
              label="Country"
              error={touched.country && !!fieldErrors.country}
              helperText={touched.country ? fieldErrors.country : undefined}
            />
          </Grid>
        </Grid>

        {/* Emergency contact */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
            Emergency Contact
          </Typography>
          <Divider sx={{ mb: 2.5, borderColor: "border.light" }} />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                id="emergencyName"
                label="Contact Name"
                value={emergencyName}
                onChange={e => {
                  setEmergencyName(e.target.value);
                  if (touched.emergencyName) validateField("emergencyName", e.target.value);
                }}
                onBlur={() => {
                  handleBlur("emergencyName", emergencyName);
                }}
                error={touched.emergencyName && !!fieldErrors.emergencyName}
                helperText={touched.emergencyName ? fieldErrors.emergencyName : undefined}
                autoComplete="name"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                id="emergencyPhone"
                name="emergencyPhone"
                label="Phone Number"
                type="tel"
                value={emergencyPhone}
                onChange={handleEmergencyPhoneChange}
                onBlur={() => {
                  handleBlur("emergencyPhone", emergencyPhone);
                }}
                fullWidth
                variant="outlined"
                error={touched.emergencyPhone && !!fieldErrors.emergencyPhone}
                helperText={(touched.emergencyPhone && fieldErrors.emergencyPhone) || "Include country code"}
                autoComplete="tel"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                id="emergencyRelationship"
                label="Relationship"
                value={emergencyRelationship}
                onChange={e => {
                  setEmergencyRelationship(e.target.value);
                  if (touched.emergencyRelationship) validateField("emergencyRelationship", e.target.value);
                }}
                onBlur={() => {
                  handleBlur("emergencyRelationship", emergencyRelationship);
                }}
                error={touched.emergencyRelationship && !!fieldErrors.emergencyRelationship}
                helperText={touched.emergencyRelationship ? fieldErrors.emergencyRelationship : undefined}
                placeholder="e.g. Spouse, Parent, Sibling"
              />
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 3,
            pt: 2,
            borderTop: t => `1px solid ${t.palette.border.light}`,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            {successMsg && (
              <Alert severity="success" sx={{ py: 0.5 }}>
                {successMsg}
              </Alert>
            )}
            {serverError && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {serverError}
              </Alert>
            )}
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
            sx={{
              px: 3,
              py: 1.25,
              fontWeight: 700,
              boxShadow: t => t.palette.shadow.button,
              "&:hover": { boxShadow: t => t.palette.shadow.buttonHover },
            }}
          >
            {loading ? "Saving..." : "Save Address"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

"use client";

import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress, Divider, Grid, TextField, Typography } from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import MuiPhoneNumber from "mui-phone-number";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { personalInfoSchema, type PersonalInfoFormData } from "@/lib/validation/schemas";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface PersonalInfoFormProps {
  readonly userId: string;
  readonly accessToken: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly dateOfBirth?: string;
  readonly addressStreet: string;
  readonly addressCity: string;
  readonly addressState: string;
  readonly addressPostalCode: string;
  readonly addressCountry: string;
  readonly emergencyName: string;
  readonly emergencyPhone: string;
  readonly emergencyRelationship: string;
  readonly languagePreference: string;
  readonly currencyPreference: string;
}

type FieldErrors = Partial<Record<keyof PersonalInfoFormData, string>>;

export default function PersonalInfoForm({
  userId,
  accessToken,
  firstName: initialFirstName,
  lastName: initialLastName,
  email,
  phone: initialPhone,
  dateOfBirth,
  addressStreet,
  addressCity,
  addressState,
  addressPostalCode,
  addressCountry,
  emergencyName,
  emergencyPhone,
  emergencyRelationship,
  languagePreference,
  currencyPreference,
}: PersonalInfoFormProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PersonalInfoFormData, boolean>>>({});

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(initialPhone);
  const [dob, setDob] = useState(dateOfBirth ? new Date(dateOfBirth) : null);

  // Convert Date | null → ISO date string for Zod (YYYY-MM-DD)
  const dobString = dob instanceof Date && !isNaN(dob.getTime()) ? dob.toISOString().split("T")[0] : undefined;

  const validateField = (field: keyof PersonalInfoFormData, value: string) => {
    const result = personalInfoSchema.shape[field].safeParse(value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const handleBlur = (field: keyof PersonalInfoFormData, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handlePhoneChange = (value: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = typeof value === "string" ? value : value.target.value;
    setPhone(raw);
    if (touched.phone) validateField("phone", raw);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg("");
    setServerError("");

    const payload: PersonalInfoFormData = { firstName, lastName, phone, dateOfBirth: dobString };
    const result = personalInfoSchema.safeParse(payload);

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof PersonalInfoFormData;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setTouched({ firstName: true, lastName: true, phone: true, dateOfBirth: true });
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
          dateOfBirth: dobString ?? null,
          address: {
            street: addressStreet,
            city: addressCity,
            state: addressState,
            postalCode: addressPostalCode,
            country: addressCountry,
          },
          emergencyContact: { name: emergencyName, phone: emergencyPhone, relationship: emergencyRelationship },
          languagePreference,
          currencyPreference,
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
      setSuccessMsg("Personal information updated successfully.");
    } catch (error) {
      logger.error("Update profile error", error);
      setServerError(error instanceof Error ? error.message : "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
        Personal Information
      </Typography>
      <Divider sx={{ mb: 3, borderColor: "border.light" }} />

      <Box
        component="form"
        onSubmit={e => {
          void handleSubmit(e as React.SyntheticEvent<HTMLFormElement>);
        }}
        noValidate
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="firstName"
              name="firstName"
              label="First Name"
              value={firstName}
              onChange={e => {
                setFirstName(e.target.value);
                if (touched.firstName) validateField("firstName", e.target.value);
              }}
              onBlur={() => {
                handleBlur("firstName", firstName);
              }}
              error={touched.firstName && !!fieldErrors.firstName}
              helperText={touched.firstName ? fieldErrors.firstName : undefined}
              autoComplete="given-name"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="lastName"
              name="lastName"
              label="Last Name"
              value={lastName}
              onChange={e => {
                setLastName(e.target.value);
                if (touched.lastName) validateField("lastName", e.target.value);
              }}
              onBlur={() => {
                handleBlur("lastName", lastName);
              }}
              error={touched.lastName && !!fieldErrors.lastName}
              helperText={touched.lastName ? fieldErrors.lastName : undefined}
              autoComplete="family-name"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="email"
              label="Email Address"
              type="email"
              value={email}
              disabled
              autoComplete="email"
              helperText="Email cannot be changed"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <MuiPhoneNumber
              id="phone"
              label="Phone Number"
              defaultCountry="eg"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => {
                handleBlur("phone", phone);
              }}
              fullWidth
              variant="outlined"
              error={touched.phone && !!fieldErrors.phone}
              helperText={(touched.phone && fieldErrors.phone) || "Include country code (e.g. +20 100 000 0000)"}
              autoComplete="tel"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date of Birth"
                value={dob}
                onChange={newValue => {
                  setDob(newValue);
                  setTouched(prev => ({ ...prev, dateOfBirth: true }));
                  const str =
                    newValue instanceof Date && !isNaN(newValue.getTime())
                      ? newValue.toISOString().split("T")[0]
                      : undefined;
                  validateField("dateOfBirth", str ?? "");
                }}
                maxDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    onBlur: () => {
                      handleBlur("dateOfBirth", dobString ?? "");
                    },
                    error: touched.dateOfBirth && !!fieldErrors.dateOfBirth,
                    helperText: touched.dateOfBirth ? fieldErrors.dateOfBirth : undefined,
                    autoComplete: "bday",
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

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
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

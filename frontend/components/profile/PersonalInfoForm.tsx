"use client";

import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress, Divider, Grid, TextField, Typography } from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("customer.accountProfile");
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
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
          validationErrors?: { field?: string; message: string }[];
          message?: string;
        } | null;

        if (body?.validationErrors && body.validationErrors.length > 0) {
          const msg = body.validationErrors[0].message;
          setServerError(msg);
          return;
        }

        const msg = body?.message ?? t("personalInfo.updateFailed");
        setServerError(msg);
        return;
      }
      setSuccessMsg(t("personalInfo.updateSuccess"));
    } catch (error) {
      logger.error("Update profile error", error);
      setServerError(error instanceof Error ? error.message : t("personalInfo.saveChangesFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
        {t("personalInfo.title")}
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="firstName"
              name="firstName"
              label={t("personalInfo.firstName")}
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
              label={t("personalInfo.lastName")}
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
              label={t("personalInfo.emailAddress")}
              type="email"
              value={email}
              disabled
              autoComplete="email"
              helperText={t("personalInfo.emailCannotBeChanged")}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="phone"
              name="phone"
              label={t("personalInfo.phoneNumber")}
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => {
                handleBlur("phone", phone);
              }}
              fullWidth
              variant="outlined"
              error={touched.phone && !!fieldErrors.phone}
              helperText={(touched.phone && fieldErrors.phone) || t("personalInfo.phoneHelperText")}
              autoComplete="tel"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={t("personalInfo.dateOfBirth")}
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
                    slotProps: {
                      htmlInput: {
                        autoComplete: "bday",
                      },
                    },
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
            borderTop: theme => `1px solid ${theme.palette.border.light}`,
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
              boxShadow: theme => theme.palette.shadow.button,
              "&:hover": { boxShadow: theme => theme.palette.shadow.buttonHover },
            }}
          >
            {loading ? t("personalInfo.saving") : t("personalInfo.saveChanges")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

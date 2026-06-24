"use client";

import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface PreferencesSectionProps {
  readonly userId: string;
  readonly accessToken: string;
  readonly languagePreference: string;
  readonly currencyPreference: string;
  // pass-through fields for full PUT payload
  readonly firstName: string;
  readonly lastName: string;
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
}

export default function PreferencesSection({
  userId,
  accessToken,
  languagePreference,
  currencyPreference,
  firstName,
  lastName,
  phone,
  dateOfBirth,
  addressStreet,
  addressCity,
  addressState,
  addressPostalCode,
  addressCountry,
  emergencyName,
  emergencyPhone,
  emergencyRelationship,
}: PreferencesSectionProps) {
  const [language, setLanguage] = useState(languagePreference);
  const [currency, setCurrency] = useState(currencyPreference);

  const sendUpdate = async (lang: string, curr: string) => {
    try {
      await fetch(toApiUrl(`/api/users/${userId}/profile`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          dateOfBirth: dateOfBirth ?? null,
          address: {
            street: addressStreet,
            city: addressCity,
            state: addressState,
            postalCode: addressPostalCode,
            country: addressCountry,
          },
          emergencyContact: {
            name: emergencyName,
            phone: emergencyPhone,
            relationship: emergencyRelationship,
          },
          languagePreference: lang,
          currencyPreference: curr,
        }),
      });
    } catch (error) {
      logger.error("Update preference error", error);
    }
  };

  const handleLanguageChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setLanguage(value);
    void sendUpdate(value, currency);
  };

  const handleCurrencyChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setCurrency(value);
    void sendUpdate(language, value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
        Preferences
      </Typography>
      <Divider sx={{ mb: 2.5, borderColor: "border.light" }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="language-label">Language</InputLabel>
          <Select
            labelId="language-label"
            id="language-select"
            value={language}
            label="Language"
            onChange={handleLanguageChange}
          >
            <MenuItem value="en">English (US)</MenuItem>
            <MenuItem value="ar">Arabic (EG)</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id="currency-label">Currency</InputLabel>
          <Select
            labelId="currency-label"
            id="currency-select"
            value={currency}
            label="Currency"
            onChange={handleCurrencyChange}
          >
            <MenuItem value="USD">USD ($)</MenuItem>
            <MenuItem value="EGP">EGP (E£)</MenuItem>
            <MenuItem value="EUR">EUR (€)</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

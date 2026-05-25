"use client";

import { useState, type SyntheticEvent } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import GeneralSettingsTab from "./_components/GeneralSettingsTab";
import TermsSettingsTab from "./_components/TermsSettingsTab";

type SettingsTabKey = "general" | "terms";

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<SettingsTabKey>("general");

  const handleTabChange = (_: SyntheticEvent, value: SettingsTabKey) => {
    setTab(value);
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 4 }}>
        <SettingsRoundedIcon fontSize="large" color="primary" />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Platform Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage global configuration and terms of service
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab icon={<SettingsRoundedIcon fontSize="small" />} iconPosition="start" label="General" value="general" />
          <Tab
            icon={<GavelRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="Terms of Service"
            value="terms"
          />
        </Tabs>
      </Box>

      {tab === "general" && <GeneralSettingsTab />}
      {tab === "terms" && <TermsSettingsTab />}
    </Box>
  );
}

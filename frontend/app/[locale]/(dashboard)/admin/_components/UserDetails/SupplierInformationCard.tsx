import React from "react";
import { Paper, Box, Grid, useTheme } from "@mui/material";
import { SupplierDetails } from "@/api-clients/users/users";
import { SectionLabel, FieldRow } from "../UserDetailsView";
import BusinessIcon from "@mui/icons-material/Business";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import NumbersIcon from "@mui/icons-material/Numbers";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

interface SupplierInformationCardProps {
  supplierDetails?: SupplierDetails | null;
  t: (key: string) => string;
}

export default function SupplierInformationCard({ supplierDetails, t }: SupplierInformationCardProps) {
  const theme = useTheme();

  if (!supplierDetails) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        mb: 2.5,
      }}
    >
      <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: theme.palette.divider }}>
        <SectionLabel>{t("details.supplierInformation") || "Supplier Information"}</SectionLabel>
        
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldRow
                icon={<BusinessIcon sx={{ fontSize: 17 }} />}
                label={t("details.companyName") || "Company Name"}
                value={supplierDetails.companyName || "—"}
                accentColor={theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldRow
                icon={<ReceiptLongIcon sx={{ fontSize: 17 }} />}
                label={t("details.commercialRegistration") || "Commercial Registration"}
                value={supplierDetails.commercialRegistration || "—"}
                accentColor={theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FieldRow
                icon={<NumbersIcon sx={{ fontSize: 17 }} />}
                label={t("details.taxNumber") || "Tax Number"}
                value={supplierDetails.taxNumber || "—"}
                accentColor={theme.palette.secondary.main || theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FieldRow
                icon={<DirectionsCarIcon sx={{ fontSize: 17 }} />}
                label={t("details.vehiclesCount") || "Vehicles Count"}
                value={supplierDetails.vehiclesCount?.toString() || "0"}
                accentColor={theme.palette.secondary.main || theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FieldRow
                icon={<AssignmentTurnedInIcon sx={{ fontSize: 17 }} />}
                label={t("details.totalBookings") || "Total Bookings"}
                value={supplierDetails.totalBookings?.toString() || "0"}
                accentColor={theme.palette.secondary.main || theme.palette.primary.main}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Paper>
  );
}

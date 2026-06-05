"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Button,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { getSupplierById, type Supplier } from "@/api-clients/suppliers/suppliers";
import { logger } from "@/utils/logger";

// ─── section label (same as EditSupplierPage) ──────────────────────────────────
function SectionLabel({ children }: { readonly children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
      <Box
        sx={{
          width: 3,
          height: 18,
          borderRadius: 99,
          bgcolor: theme.palette.primary.main,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: theme.palette.primary.main,
        }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

// ─── info row ──────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  iconBg,
  iconColor,
  label,
  children,
}: {
  readonly icon: React.ReactNode;
  readonly iconBg: string;
  readonly iconColor: string;
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "action.hover",
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "border-color 0.18s, box-shadow 0.18s",
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.3),
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.06)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.5,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.disabled",
            mb: 0.3,
            display: "block",
          }}
        >
          {label}
        </Typography>
        {children}
      </Box>
    </Paper>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────
export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const supplierId = Array.isArray(params.supplierId) ? params.supplierId[0] : params.supplierId;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) return;
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const data = await getSupplierById(supplierId);
        setSupplier(data);
      } catch (err) {
        logger.error("Failed to load supplier", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchSupplier();
  }, [supplierId]);

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          mt: 14,
        }}
      >
        <CircularProgress size={36} thickness={4} />
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>Loading supplier…</Typography>
      </Box>
    );
  }

  // ── not found ─────────────────────────────────────────────────────────────
  if (!supplier || !supplierId) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error" variant="h6" sx={{ mb: 2 }}>
          Supplier not found
        </Typography>
        <Button
          onClick={() => {
            router.back();
          }}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  // Determine status metadata
  let statusMeta: { label: string; color: string; bg: string };

  if (supplier.status === "active") {
    statusMeta = {
      label: "Active",
      color: theme.palette.status.active.main,
      bg: theme.palette.status.active.light,
    };
  } else if (supplier.status === "blocked") {
    statusMeta = {
      label: "Blocked",
      color: theme.palette.status.blocked.main,
      bg: theme.palette.status.blocked.light,
    };
  } else if (supplier.status === "pending") {
    statusMeta = {
      label: "Pending",
      color: theme.palette.status.pending.main,
      bg: theme.palette.status.pending.light,
    };
  } else {
    statusMeta = {
      label: supplier.status,
      color: theme.palette.text.secondary,
      bg: theme.palette.action.hover,
    };
  }

  const initials = supplier.firstName ? supplier.firstName[0].toUpperCase() : "?";

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 700, mx: "auto" }}>
      {/* ── identity card ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "divider",
          background: "action.hover",
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            fontWeight: 800,
            fontSize: "1.2rem",
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.27)}`,
          }}
        >
          {initials}
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {supplier.firstName} {supplier.lastName}
          </Typography>
          <Chip
            label={statusMeta.label}
            size="small"
            sx={{
              mt: 0.6,
              height: 20,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: statusMeta.color,
              bgcolor: statusMeta.bg,
              border: "none",
            }}
          />
        </Box>
      </Paper>

      {/* ── main card ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Business section */}
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          <SectionLabel>Business Information</SectionLabel>
          <Stack spacing={2}>
            <InfoRow
              icon={<BusinessIcon sx={{ fontSize: 18 }} />}
              iconBg={theme.palette.icon.business.bg}
              iconColor={theme.palette.icon.business.color}
              label="Company Name"
            >
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: theme.palette.primary.main }}>
                {supplier.companyProfile?.companyName || "N/A"}
              </Typography>
            </InfoRow>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <InfoRow
                icon={<ReceiptLongIcon sx={{ fontSize: 17 }} />}
                iconBg={alpha(theme.palette.divider, 0.12)}
                iconColor={theme.palette.text.secondary}
                label="Commercial Reg."
              >
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {supplier.companyProfile?.commercialRegistrationNumber || "—"}
                </Typography>
              </InfoRow>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "action.hover",
                  flex: 1,
                  transition: "border-color 0.18s, box-shadow 0.18s",
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.06)}`,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "text.disabled",
                    mb: 0.3,
                    display: "block",
                  }}
                >
                  Tax ID
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {supplier.companyProfile?.taxId || "—"}
                </Typography>
              </Paper>
            </Stack>
          </Stack>
        </Box>

        <Divider />

        {/* Contact section */}
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          <SectionLabel>Contact Details</SectionLabel>
          <Stack spacing={2}>
            <InfoRow
              icon={<EmailIcon sx={{ fontSize: 18 }} />}
              iconBg={theme.palette.icon.email.bg}
              iconColor={theme.palette.icon.email.color}
              label="Email Address"
            >
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>{supplier.email}</Typography>
            </InfoRow>

            <InfoRow
              icon={<PhoneIcon sx={{ fontSize: 18 }} />}
              iconBg={theme.palette.icon.phone.bg}
              iconColor={theme.palette.icon.phone.color}
              label="Phone Number"
            >
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>{supplier.phoneNumber || "—"}</Typography>
            </InfoRow>
          </Stack>
        </Box>

        <Divider />

        {/* Roles section */}

        {/* Footer */}
        <Box
          sx={{
            px: { xs: 3, sm: 4 },
            py: 2.5,
            borderTop: "1px solid",
            borderColor: "divider",
            background: "action.hover",
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              router.back();
            }}
            startIcon={<ArrowBackIcon fontSize="small" />}
            sx={{
              borderRadius: 2.5,
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderWidth: 1.5,
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon fontSize="small" />}
            onClick={() => {
              router.push(`/admin/suppliers/${supplierId}/edit`);
            }}
            disableElevation
            sx={{
              borderRadius: 2.5,
              px: 3,
              fontWeight: 700,
              textTransform: "none",
              letterSpacing: "0.01em",
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.27)}`,
              transition: "box-shadow 0.2s, transform 0.15s",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.33)}`,
              },
              "&:active": { transform: "translateY(0)" },
            }}
          >
            Edit Supplier
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

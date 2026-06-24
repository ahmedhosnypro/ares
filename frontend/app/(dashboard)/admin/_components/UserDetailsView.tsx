"use client";

// cspell:ignore pendingverification

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Avatar,
  Grid,
  Alert,
  LinearProgress,
  Rating,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
  Theme,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import DateRangeIcon from "@mui/icons-material/DateRange";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import BusinessIcon from "@mui/icons-material/Business";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";

export type UserType = "user" | "supplier" | "driver" | "inspector";

export interface UserDetailsViewProps {
  readonly userType: UserType;
  readonly data: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phoneNumber?: string | null;
    readonly status: string;
    readonly isActive?: boolean;
    readonly avatarUrl?: string | null;
    readonly roles?: readonly string[];
    readonly dateOfBirth?: string | null;

    // Supplier specific:
    readonly companyProfile?: {
      readonly companyName?: string;
      readonly commercialRegistrationNumber?: string;
      readonly taxId?: string;
    };

    // Inspector specific:
    readonly employeeCode?: string;
    readonly isAvailable?: boolean;
    readonly assignedCount?: number;
    readonly pendingCount?: number;
    readonly approvedCount?: number;
    readonly rejectedCount?: number;
    readonly recentInspections?: readonly {
      readonly inspectionId: string;
      readonly bookingId: string;
      readonly bookingNumber: string | null;
      readonly status: string;
      readonly inspectionDate: string;
      readonly submittedAt: string | null;
    }[];

    // Driver specific:
    readonly profilePictureUrl?: string;
    readonly licenseNumber?: string;
    readonly licenseExpiryDate?: string;
    readonly licenseImage?: string;
    readonly nationalIdFrontImage?: string;
    readonly nationalIdBackImage?: string;
    readonly address?: string;
    readonly emergencyContactName?: string;
    readonly emergencyContactPhone?: string;
    readonly rejectionReason?: string;
    readonly workAreas?: readonly {
      readonly id: string;
      readonly name: string;
      readonly governorate: string;
      readonly isActive: boolean;
    }[];
    readonly totalTrips?: number;
    readonly averageRating?: number;
    readonly availability?: string;
  };
  readonly isMock?: boolean;
  readonly onBack: () => void;
  readonly onEdit?: () => void;
  readonly onToggleStatus?: () => void | Promise<void>;
  readonly onApprove?: () => void | Promise<void>;
  readonly onReject?: (reason: string) => void | Promise<void>;
  readonly actionLoading?: boolean;
}

// ─── Stat Card Component (MUI Theme Compliant) ───────────────────────────────
function StatCard({ label, value, color }: { readonly label: string; readonly value: number; readonly color: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        background: theme =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(color, 0.08)} 100%)`,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color }}>
        {value}
      </Typography>
    </Paper>
  );
}

// ─── Section Label Component ──────────────────────────────────────────────────
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

const BREADCRUMB_CATEGORIES: Record<UserType, string> = {
  supplier: "Suppliers",
  driver: "Drivers",
  inspector: "Inspectors",
  user: "Users",
};

const PAGE_TITLES: Record<UserType, string> = {
  supplier: "Supplier Details",
  driver: "Driver Details",
  inspector: "Inspector Details",
  user: "User Details",
};

const STATUS_CATEGORIES: Record<string, "success" | "warning" | "error" | undefined> = {
  active: "success",
  verified: "success",
  approved: "success",
  pending: "warning",
  pendingverification: "warning",
  blocked: "error",
  rejected: "error",
  suspended: "error",
};

function getCompletenessItems(userType: UserType, data: UserDetailsViewProps["data"]) {
  const statusLower = (data.status || "").toLowerCase();
  const items = [
    {
      label: "Status: " + statusLower,
      done:
        statusLower === "active" ||
        statusLower === "verified" ||
        statusLower === "approved" ||
        statusLower === "pending",
    },
    { label: "Email configured", done: Boolean(data.email) },
    { label: "Phone Number configured", done: Boolean(data.phoneNumber) },
  ];
  if (userType === "supplier") {
    items.push({ label: "Company profile details", done: Boolean(data.companyProfile?.companyName) });
  } else if (userType === "driver") {
    items.push({ label: "License verification uploaded", done: Boolean(data.licenseNumber && data.licenseImage) });
  } else if (userType === "inspector") {
    items.push({ label: "Employee code assigned", done: Boolean(data.employeeCode) });
  } else {
    items.push({ label: "Role assigned", done: Boolean(data.roles && data.roles.length > 0) });
  }
  return items;
}

function getStatusDetails(statusVal: string, theme: Theme) {
  const s = (statusVal || "").toLowerCase();
  const category = STATUS_CATEGORIES[s];

  if (category === "success") {
    const mainColor = theme.palette.status.active.main || theme.palette.success.main;
    return {
      color: mainColor,
      bgColor: alpha(mainColor, 0.12),
      borderColor: alpha(mainColor, 0.25),
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />,
      label: statusVal || "Active",
      desc: "This account is active and verified with full platform access.",
    };
  }

  if (category === "warning") {
    const mainColor = theme.palette.status.pending.main || theme.palette.warning.main;
    return {
      color: mainColor,
      bgColor: alpha(mainColor, 0.12),
      borderColor: alpha(mainColor, 0.25),
      icon: <AccessTimeIcon sx={{ fontSize: 15 }} />,
      label: statusVal || "Pending",
      desc: "This account is awaiting confirmation or verification.",
    };
  }

  if (category === "error") {
    const mainColor = theme.palette.status.blocked.main || theme.palette.error.main;
    return {
      color: mainColor,
      bgColor: alpha(mainColor, 0.12),
      borderColor: alpha(mainColor, 0.25),
      icon: <BlockIcon sx={{ fontSize: 15 }} />,
      label: statusVal || "Blocked",
      desc: "This account is restricted from accessing the platform.",
    };
  }

  // Default Fallback
  return {
    color: theme.palette.text.secondary,
    bgColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
    icon: <AccessTimeIcon sx={{ fontSize: 15 }} />,
    label: statusVal || "Unknown",
    desc: "Status is undefined.",
  };
}

interface ExtraActionButtonsProps {
  readonly userType: UserType;
  readonly data: UserDetailsViewProps["data"];
  readonly actionLoading: boolean;
  readonly onToggleStatus?: () => void | Promise<void>;
  readonly onApprove?: () => void | Promise<void>;
  readonly onReject?: (reason: string) => void | Promise<void>;
  readonly setRejectOpen: (open: boolean) => void;
}

function ExtraActionButtons({
  userType,
  data,
  actionLoading,
  onToggleStatus,
  onApprove,
  onReject,
  setRejectOpen,
}: ExtraActionButtonsProps) {
  if (userType === "inspector" && onToggleStatus) {
    return (
      <Button
        variant="contained"
        disableElevation
        color={data.isActive ? "error" : "success"}
        disabled={actionLoading}
        onClick={() => {
          void onToggleStatus();
        }}
        sx={{
          borderRadius: 2,
          px: 3,
          fontWeight: 600,
          textTransform: "none",
          fontSize: 13,
        }}
      >
        {data.isActive ? "Disable Inspector" : "Enable Inspector"}
      </Button>
    );
  }

  if (userType === "driver") {
    return (
      <>
        {data.status !== "Verified" && onApprove && (
          <Button
            variant="contained"
            color="success"
            disabled={actionLoading}
            onClick={() => {
              void onApprove();
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Approve
          </Button>
        )}
        {data.status !== "Rejected" && onReject && (
          <Button
            variant="outlined"
            color="error"
            disabled={actionLoading}
            onClick={() => {
              setRejectOpen(true);
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Reject
          </Button>
        )}
        {onToggleStatus && (
          <Button
            variant="outlined"
            color={data.isActive ? "warning" : "primary"}
            disabled={actionLoading}
            onClick={() => {
              void onToggleStatus();
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {data.isActive ? "Disable Account" : "Enable Account"}
          </Button>
        )}
      </>
    );
  }

  return null;
}

interface FieldRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly accentColor: string;
}

function FieldRow({ icon, label, value, accentColor }: FieldRowProps) {
  const theme = useTheme();

  const fieldLabel = {
    fontWeight: 600,
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
    color: theme.palette.text.disabled,
    mb: 0.5,
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.75,
        px: 2,
        borderRadius: 2,
        position: "relative",
        transition: "background 0.15s",
        "&:hover": { bgcolor: alpha(accentColor, 0.04) },
        // Left accent bar
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: "25%",
          bottom: "25%",
          width: 3,
          borderRadius: 4,
          bgcolor: alpha(accentColor, 0),
          transition: "background 0.2s",
        },
        "&:hover::before": { bgcolor: accentColor },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          bgcolor: alpha(accentColor, 0.1),
          color: accentColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={fieldLabel}>{label}</Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 14, color: theme.palette.text.primary, lineHeight: 1.3 }}>
          {value || "—"}
        </Typography>
      </Box>
    </Box>
  );
}

export default function UserDetailsView({
  userType,
  data,
  isMock = false,
  onBack,
  onEdit,
  onToggleStatus,
  onApprove,
  onReject,
  actionLoading = false,
}: UserDetailsViewProps) {
  const theme = useTheme();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fieldLabel = {
    fontWeight: 600,
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
    color: theme.palette.text.disabled,
    mb: 0.5,
  };

  const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || "User";

  // Breadcrumbs title
  const breadcrumbCategory = BREADCRUMB_CATEGORIES[userType];
  const pageTitle = PAGE_TITLES[userType];

  const statusInfo = getStatusDetails(data.status, theme);

  // Profile Completeness Score
  const completenessItems = getCompletenessItems(userType, data);

  const completenessScore = Math.round((completenessItems.filter(i => i.done).length / completenessItems.length) * 100);

  // Theme-compliant avatar backgrounds
  const avatarColors = [
    theme.palette.primary.main,
    theme.palette.primary.light,
    theme.palette.secondary.main || theme.palette.primary.main,
    theme.palette.status.pending.main || theme.palette.warning.main,
    theme.palette.status.active.main || theme.palette.success.main,
  ];
  const avatarBg = avatarColors[(data.firstName.charCodeAt(0) || 0) % avatarColors.length];

  const handleConfirmReject = () => {
    if (onReject && rejectReason.trim()) {
      void onReject(rejectReason.trim());
      setRejectOpen(false);
      setRejectReason("");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      {/* Breadcrumbs */}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 3 }}>
        <Typography
          variant="caption"
          sx={{
            cursor: "pointer",
            fontWeight: 500,
            color: theme.palette.text.secondary,
            "&:hover": { color: theme.palette.primary.main },
            transition: "color 0.15s",
          }}
          onClick={onBack}
        >
          {breadcrumbCategory}
        </Typography>
        <NavigateNextIcon sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
        <Typography variant="caption" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
          {pageTitle}
        </Typography>
      </Stack>

      {isMock && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, fontSize: 13 }}>
          Failed to load live data. Showing mock data for demonstration purposes.
        </Alert>
      )}

      {/* ── SIGNATURE HERO HEADER ──────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: theme.palette.divider,
          overflow: "hidden",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          minHeight: { sm: 140 },
        }}
      >
        {/* Left mesh identity strip */}
        <Box
          sx={{
            flex: { sm: "0 0 340px" },
            px: { xs: 3, sm: 3.5 },
            py: { xs: 3, sm: 3.5 },
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.common.black, 0.6)}, ${alpha(theme.palette.primary.main, 0.15)})`
                : `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* mesh backdrop */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(circle at 80% 20%, ${alpha(avatarBg, 0.25)} 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 40%)`,
              pointerEvents: "none",
            }}
          />
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={data.avatarUrl || data.profilePictureUrl || undefined}
              sx={{
                width: 60,
                height: 60,
                bgcolor: avatarBg,
                fontWeight: 800,
                fontSize: 22,
                boxShadow: `0 0 0 2px ${alpha(avatarBg, 0.4)}, 0 4px 16px ${alpha("#000", 0.4)}`,
              }}
            >
              {data.firstName.charAt(0).toUpperCase() || "?"}
            </Avatar>
            {/* status dot */}
            <Box
              sx={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: statusInfo.color,
                border: "2px solid #1e293b",
                boxShadow: `0 0 8px ${alpha(statusInfo.color, 0.7)}`,
              }}
            />
          </Box>
          <Box sx={{ minWidth: 0, zIndex: 1 }}>
            <Typography
              sx={{ fontWeight: 800, fontSize: { xs: 17, sm: 19 }, color: "#f8fafc", lineHeight: 1.2, mb: 0.4 }}
            >
              {name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: alpha("#f8fafc", 0.5), mb: 1.25, fontWeight: 400 }} noWrap>
              {data.email}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.5 }}>
              <Chip
                size="small"
                label={statusInfo.label}
                sx={{
                  height: 20,
                  fontWeight: 700,
                  fontSize: 10,
                  bgcolor: alpha(statusInfo.color, 0.2),
                  color: statusInfo.color,
                  border: "1px solid",
                  borderColor: alpha(statusInfo.color, 0.4),
                }}
              />
              {userType === "inspector" && data.employeeCode && (
                <Chip
                  size="small"
                  label={`Code: ${data.employeeCode}`}
                  sx={{
                    height: 20,
                    fontWeight: 600,
                    fontSize: 10,
                    bgcolor: alpha("#fff", 0.08),
                    color: alpha("#f8fafc", 0.8),
                    border: "1px solid",
                    borderColor: alpha("#fff", 0.12),
                  }}
                />
              )}
              {data.roles?.map((r: string, i: number) => (
                <Chip
                  key={i}
                  size="small"
                  label={r}
                  sx={{
                    height: 20,
                    fontWeight: 600,
                    fontSize: 10,
                    bgcolor: alpha("#fff", 0.08),
                    color: alpha("#f8fafc", 0.8),
                    border: "1px solid",
                    borderColor: alpha("#fff", 0.12),
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Right: action and quick stats panel */}
        <Box
          sx={{
            flex: 1,
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 2.5, sm: 3.5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            bgcolor: theme.palette.background.paper,
            borderLeft: { sm: "1px solid" },
            borderTop: { xs: "1px solid", sm: "none" },
            borderColor: theme.palette.divider,
          }}
        >
          {/* Quick stats for dashboard feel */}
          <Stack direction="row" spacing={4} sx={{ display: { xs: "none", md: "flex" } }}>
            {userType === "driver" && (
              <>
                <Box>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <Typography
                      sx={{ fontWeight: 800, fontSize: 20, color: theme.palette.text.primary, lineHeight: 1 }}
                    >
                      {data.averageRating ? data.averageRating.toFixed(1) : "—"}
                    </Typography>
                    {data.averageRating !== undefined && (
                      <Rating value={data.averageRating} readOnly size="small" precision={0.5} />
                    )}
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.disabled, fontWeight: 500, mt: 0.3, display: "block" }}
                  >
                    Rating
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 20, color: theme.palette.text.primary, lineHeight: 1 }}>
                    {data.totalTrips ?? 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.disabled, fontWeight: 500, mt: 0.3, display: "block" }}
                  >
                    Trips
                  </Typography>
                </Box>
              </>
            )}
            {userType === "inspector" && (
              <>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 20, color: theme.palette.text.primary, lineHeight: 1 }}>
                    {data.assignedCount ?? 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.disabled, fontWeight: 500, mt: 0.3, display: "block" }}
                  >
                    Assigned
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 20, color: theme.palette.text.primary, lineHeight: 1 }}>
                    {data.approvedCount ?? 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.disabled, fontWeight: 500, mt: 0.3, display: "block" }}
                  >
                    Inspected
                  </Typography>
                </Box>
              </>
            )}
            {userType === "user" && (
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 20, color: theme.palette.text.primary, lineHeight: 1 }}>
                  {completenessScore}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.disabled, fontWeight: 500, mt: 0.3, display: "block" }}
                >
                  Profile Score
                </Typography>
              </Box>
            )}
            {userType === "supplier" && (
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 20,
                    color: theme.palette.text.primary,
                    lineHeight: 1,
                    textTransform: "capitalize",
                  }}
                >
                  {data.status}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.disabled, fontWeight: 500, mt: 0.3, display: "block" }}
                >
                  Status
                </Typography>
              </Box>
            )}
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ ml: "auto", flexWrap: "wrap", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={onBack}
              startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
              sx={{
                borderRadius: 2,
                fontWeight: 500,
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
                textTransform: "none",
                px: 2.5,
                fontSize: 13,
                "&:hover": { borderColor: theme.palette.text.secondary, bgcolor: theme.palette.action.hover },
              }}
            >
              Back
            </Button>

            {onEdit && (
              <Button
                variant="contained"
                disableElevation
                onClick={onEdit}
                startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: 13,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                  "&:hover": { boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}` },
                }}
              >
                Edit
              </Button>
            )}

            <ExtraActionButtons
              userType={userType}
              data={data}
              actionLoading={actionLoading}
              onToggleStatus={onToggleStatus}
              onApprove={onApprove}
              onReject={onReject}
              setRejectOpen={setRejectOpen}
            />
          </Stack>
        </Box>
      </Paper>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ alignItems: "flex-start" }}>
        {/* LEFT COLUMN */}
        <Grid size={{ xs: 12, lg: 8.5 }}>
          {/* Account Profile Card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
              mb: 2.5,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 17 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Account Profile</Typography>
                <Typography variant="caption" color="text.secondary">
                  System registration details
                </Typography>
              </Box>
            </Box>
            <Box sx={{ px: 1, py: 1 }}>
              <FieldRow
                icon={<EmailOutlinedIcon sx={{ fontSize: 17 }} />}
                label="Email Address"
                value={data.email || "No email assigned"}
                accentColor={theme.palette.primary.main}
              />
            </Box>
          </Paper>

          {/* Supplier Specific: Business Profile */}
          {userType === "supplier" && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: theme.palette.divider,
                bgcolor: theme.palette.background.paper,
                mb: 2.5,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  borderBottom: "1px solid",
                  borderColor: theme.palette.divider,
                  bgcolor: alpha(theme.palette.secondary.main || theme.palette.primary.main, 0.03),
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.secondary.main || theme.palette.primary.main, 0.1),
                    color: theme.palette.secondary.main || theme.palette.primary.main,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 17 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Business Information</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Corporate registry & tax settings
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ px: 1, py: 1 }}>
                <Grid container spacing={1}>
                  <Grid size={12}>
                    <FieldRow
                      icon={<BusinessIcon sx={{ fontSize: 17 }} />}
                      label="Company Name"
                      value={data.companyProfile?.companyName || "No company name"}
                      accentColor={theme.palette.secondary.main || theme.palette.primary.main}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldRow
                      icon={<ReceiptLongIcon sx={{ fontSize: 17 }} />}
                      label="Commercial Registration Number"
                      value={data.companyProfile?.commercialRegistrationNumber || "—"}
                      accentColor={theme.palette.secondary.main || theme.palette.primary.main}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldRow
                      icon={<AssignmentOutlinedIcon sx={{ fontSize: 17 }} />}
                      label="Tax ID"
                      value={data.companyProfile?.taxId || "—"}
                      accentColor={theme.palette.secondary.main || theme.palette.primary.main}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}

          {/* Personal Information Card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
              mb: userType === "driver" || userType === "inspector" ? 2.5 : 0,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
                bgcolor: alpha(theme.palette.info.main, 0.03),
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersonOutlineIcon sx={{ fontSize: 17 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Personal Information</Typography>
                <Typography variant="caption" color="text.secondary">
                  Contact and basic credentials
                </Typography>
              </Box>
            </Box>
            <Box sx={{ px: 1, py: 1 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldRow
                    icon={<PersonOutlineIcon sx={{ fontSize: 17 }} />}
                    label="First Name"
                    value={data.firstName || ""}
                    accentColor={theme.palette.info.main}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldRow
                    icon={<PersonOutlineIcon sx={{ fontSize: 17 }} />}
                    label="Last Name"
                    value={data.lastName || ""}
                    accentColor={theme.palette.info.main}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldRow
                    icon={<PhoneIcon sx={{ fontSize: 17 }} />}
                    label="Phone Number"
                    value={data.phoneNumber || "No phone number registered"}
                    accentColor={theme.palette.info.main}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldRow
                    icon={<DateRangeIcon sx={{ fontSize: 17 }} />}
                    label="Date of Birth"
                    value={data.dateOfBirth || "—"}
                    accentColor={theme.palette.info.main}
                  />
                </Grid>
                {userType === "driver" && data.address && (
                  <Grid size={12}>
                    <FieldRow
                      icon={<HomeOutlinedIcon sx={{ fontSize: 17 }} />}
                      label="Address"
                      value={data.address}
                      accentColor={theme.palette.info.main}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>

          {/* Driver Specific: Emergency Contacts, Work Areas, & Documents */}
          {userType === "driver" && (
            <>
              {/* Emergency Contacts */}
              {(data.emergencyContactName || data.emergencyContactPhone) && (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: theme.palette.divider,
                    bgcolor: theme.palette.background.paper,
                    mb: 2.5,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      borderBottom: "1px solid",
                      borderColor: theme.palette.divider,
                      bgcolor: alpha(theme.palette.secondary.main, 0.03),
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ContactPhoneOutlinedIcon sx={{ fontSize: 17 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Emergency Contact</Typography>
                      <Typography variant="caption" color="text.secondary">
                        In case of unexpected events
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ px: 1, py: 1 }}>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FieldRow
                          icon={<PersonOutlineIcon sx={{ fontSize: 17 }} />}
                          label="Emergency Contact Name"
                          value={data.emergencyContactName || "—"}
                          accentColor={theme.palette.secondary.main}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FieldRow
                          icon={<PhoneIcon sx={{ fontSize: 17 }} />}
                          label="Emergency Phone"
                          value={data.emergencyContactPhone || "—"}
                          accentColor={theme.palette.secondary.main}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              )}

              {/* Work Areas */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                  bgcolor: theme.palette.background.paper,
                  mb: 2.5,
                  p: 3,
                }}
              >
                <SectionLabel>Assigned Work Areas</SectionLabel>
                {!data.workAreas || data.workAreas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No work areas selected for this driver.
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {data.workAreas.map(a => (
                      <Chip
                        key={a.id}
                        label={`${a.name} (${a.governorate})`}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: a.isActive ? alpha(theme.palette.primary.main, 0.08) : theme.palette.action.hover,
                          color: a.isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                          border: "1px solid",
                          borderColor: a.isActive ? alpha(theme.palette.primary.main, 0.2) : theme.palette.divider,
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Paper>

              {/* Documents */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                  bgcolor: theme.palette.background.paper,
                  p: 3,
                }}
              >
                <SectionLabel>Uploaded Verification Documents</SectionLabel>
                <Grid container spacing={2}>
                  {[
                    { label: "Driver License Image", url: data.licenseImage },
                    { label: "National ID (Front)", url: data.nationalIdFrontImage },
                    { label: "National ID (Back)", url: data.nationalIdBackImage },
                  ].map(doc => (
                    <Grid size={{ xs: 12, sm: 4 }} key={doc.label}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 700, mb: 1, display: "block" }}
                      >
                        {doc.label}
                      </Typography>
                      {doc.url ? (
                        <Box
                          component="a"
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: "block", mt: 0.5 }}
                        >
                          <Box
                            component="img"
                            src={doc.url}
                            alt={doc.label}
                            sx={{
                              width: "100%",
                              height: 130,
                              objectFit: "cover",
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: theme.palette.divider,
                              transition: "transform 0.2s, box-shadow 0.2s",
                              "&:hover": {
                                transform: "scale(1.02)",
                                boxShadow: `0 4px 10px ${alpha(theme.palette.common.black, 0.15)}`,
                              },
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                          Not uploaded
                        </Typography>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </>
          )}

          {/* Inspector Specific: Inspections list */}
          {userType === "inspector" && (
            <>
              {/* Stat grid */}
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard label="Total Assigned" value={data.assignedCount ?? 0} color={theme.palette.primary.main} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    label="Pending"
                    value={data.pendingCount ?? 0}
                    color={theme.palette.status.pending.main || theme.palette.warning.main}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    label="Approved"
                    value={data.approvedCount ?? 0}
                    color={theme.palette.status.active.main || theme.palette.success.main}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    label="Rejected"
                    value={data.rejectedCount ?? 0}
                    color={theme.palette.status.blocked.main || theme.palette.error.main}
                  />
                </Grid>
              </Grid>

              {/* Recent Inspections Table */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                  bgcolor: theme.palette.background.paper,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Recent Inspections
                </Typography>
                {!data.recentInspections || data.recentInspections.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No inspections recorded yet.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Booking</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Inspection Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Submitted At</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentInspections.map(r => {
                        const chip = getStatusDetails(r.status, theme);
                        return (
                          <TableRow key={r.inspectionId} hover>
                            <TableCell>{r.bookingNumber || r.bookingId.split("-")[0]}</TableCell>
                            <TableCell>{new Date(r.inspectionDate).toLocaleString()}</TableCell>
                            <TableCell>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={r.status}
                                size="small"
                                sx={{ bgcolor: chip.bgColor, color: chip.color, fontWeight: 700 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </>
          )}
        </Grid>

        {/* RIGHT SIDEBAR */}
        <Grid size={{ xs: 12, lg: 3.5 }}>
          {/* Access Control Card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.paper,
              mb: 2.5,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
                bgcolor: alpha(theme.palette.status.pending.main || theme.palette.warning.main, 0.03),
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1.25,
                  bgcolor: alpha(theme.palette.status.pending.main || theme.palette.warning.main, 0.1),
                  color: theme.palette.status.pending.main || theme.palette.warning.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Access Control</Typography>
                <Typography variant="caption" color="text.secondary">
                  Permissions and status
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 2.5 }}>
              {/* Assigned Role */}
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ ...fieldLabel, mb: 1 }}>Assigned Role</Typography>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {data.roles && data.roles.length > 0 ? (
                    data.roles.map((role: string, index: number) => (
                      <Chip
                        key={index}
                        label={role}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: 12,
                          textTransform: "capitalize",
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: theme.palette.primary.main,
                          border: "1px solid",
                          borderColor: alpha(theme.palette.primary.main, 0.18),
                        }}
                      />
                    ))
                  ) : (
                    <Chip
                      label={userType.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: "capitalize",
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main,
                        border: "1px solid",
                        borderColor: alpha(theme.palette.primary.main, 0.18),
                      }}
                    />
                  )}
                </Stack>
              </Box>

              {/* Account Status banner */}
              <Box>
                <Typography sx={{ ...fieldLabel, mb: 1 }}>Account Status</Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: statusInfo.borderColor,
                    bgcolor: statusInfo.bgColor,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.25,
                  }}
                >
                  <Box sx={{ mt: 0.1, color: statusInfo.color, flexShrink: 0 }}>{statusInfo.icon}</Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: statusInfo.color, fontSize: 13, mb: 0.25 }}
                    >
                      {statusInfo.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: statusInfo.color, opacity: 0.8, lineHeight: 1.45, display: "block" }}
                    >
                      {userType === "driver" && data.rejectionReason
                        ? `Reason: ${data.rejectionReason}`
                        : statusInfo.desc}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Profile Completeness Card (for standard users, suppliers, etc.) */}
          {userType !== "inspector" && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: theme.palette.divider,
                bgcolor: theme.palette.background.paper,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: theme.palette.divider }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 12.5, color: "text.secondary" }}>
                    Profile Completeness
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 12.5,
                      color:
                        completenessScore === 100
                          ? theme.palette.status.active.main || theme.palette.success.main
                          : theme.palette.primary.main,
                    }}
                  >
                    {completenessScore}%
                  </Typography>
                </Stack>
              </Box>

              {/* Body */}
              <Box sx={{ px: 2, pt: 1.75, pb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={completenessScore}
                  sx={{
                    height: 5,
                    borderRadius: 4,
                    mb: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      background:
                        completenessScore === 100
                          ? `linear-gradient(90deg, ${theme.palette.status.active.main || theme.palette.success.main}, ${theme.palette.success.light || theme.palette.success.main})`
                          : `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.6)})`,
                    },
                  }}
                />

                {/* Checklist Items Container */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                  {completenessItems.map(item => (
                    <Stack key={item.label} direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      {item.done ? (
                        <CheckCircleIcon
                          sx={{
                            fontSize: 13,
                            color: theme.palette.status.active.main || theme.palette.success.main,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <RadioButtonUncheckedIcon
                          sx={{ fontSize: 13, color: theme.palette.text.disabled, flexShrink: 0 }}
                        />
                      )}
                      <Typography
                        sx={{
                          color: item.done ? "text.primary" : "text.disabled",
                          fontWeight: item.done ? 500 : 400,
                          fontSize: 11.5,
                          textTransform: "capitalize",
                          lineHeight: 1,
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                  ))}
                </Box>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Rejection Dialog for Drivers */}
      <Dialog
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Driver Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
            Please state the reason for rejecting this driver profile. This will be shared with the driver.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Rejection Reason"
            value={rejectReason}
            onChange={e => {
              setRejectReason(e.target.value);
            }}
            placeholder="e.g. License documents are illegible or expired."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setRejectOpen(false);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmReject} variant="contained" color="error" disabled={!rejectReason.trim()}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

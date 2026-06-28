"use client";

import { Box, Chip, Divider, List, ListItem, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import { useTranslations } from "next-intl";

interface VerificationStatusProps {
  readonly emailVerified: boolean;
  readonly phoneVerified: boolean;
  readonly licenseVerified: boolean;
  readonly licensePending?: boolean;
  readonly kycStatus?: string;
  readonly onVerifyIdentity?: () => void;
  readonly onUploadLicense?: () => void;
  readonly isInspector?: boolean;
}

interface VerificationItemProps {
  readonly label: string;
  readonly isVerified: boolean;
  readonly isPending?: boolean;
  readonly actionText: string;
  readonly icon: React.ReactNode;
  readonly isLast: boolean;
  readonly onClick?: () => void;
  readonly pendingLabel: string;
  readonly verifiedLabel: string;
}

function VerificationItem({
  label,
  isVerified,
  isPending,
  actionText,
  icon,
  isLast,
  onClick,
  pendingLabel,
  verifiedLabel,
}: VerificationItemProps) {
  return (
    <>
      <ListItem sx={{ px: 0, py: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isPending ? "warning.light" : isVerified ? "success.light" : "error.light",
                color: isPending ? "warning.dark" : isVerified ? "success.dark" : "error.dark",
                flexShrink: 0,
              }}
            >
              {isPending ? (
                <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />
              ) : isVerified ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
              ) : (
                <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</Box>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            {isPending ? (
              <Chip
                label={pendingLabel}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: "0.7rem" }}
              />
            ) : !isVerified ? (
              <Chip
                label={actionText}
                size="small"
                color="warning"
                variant="outlined"
                clickable={!!onClick}
                onClick={onClick}
                sx={{ fontWeight: 700, fontSize: "0.7rem" }}
              />
            ) : (
              <Chip
                label={verifiedLabel}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: "0.7rem" }}
              />
            )}
          </Box>
        </Box>
      </ListItem>
      {!isLast && <Divider sx={{ borderColor: "border.light" }} />}
    </>
  );
}

export default function VerificationStatus({
  emailVerified,
  phoneVerified,
  licenseVerified,
  licensePending = false,
  kycStatus,
  onVerifyIdentity,
  onUploadLicense,
  isInspector = false,
}: VerificationStatusProps) {
  const t = useTranslations("customer.accountProfile");
  const isKycVerified =
    kycStatus?.toLowerCase() === "approved" ||
    kycStatus?.toLowerCase() === "basic" ||
    kycStatus?.toLowerCase() === "standard" ||
    kycStatus?.toLowerCase() === "enhanced";

  const isKycPending = kycStatus?.toLowerCase() === "pending";

  const items = [
    {
      label: t("verificationStatus.emailAddress"),
      isVerified: emailVerified,
      isPending: false,
      actionText: t("verificationStatus.verify"),
      icon: <EmailRoundedIcon sx={{ fontSize: 15 }} />,
    },
    {
      label: t("verificationStatus.phoneNumber"),
      isVerified: phoneVerified,
      isPending: false,
      actionText: t("verificationStatus.verify"),
      icon: <PhoneRoundedIcon sx={{ fontSize: 15 }} />,
    },
    {
      label: t("verificationStatus.identityVerification"),
      isVerified: isKycVerified,
      isPending: isKycPending,
      actionText: t("verificationStatus.verify"),
      icon: <BadgeRoundedIcon sx={{ fontSize: 15 }} />,
      onClick: onVerifyIdentity,
    },
    ...(!isInspector
      ? [
          {
            label: t("verificationStatus.driversLicense"),
            isVerified: licenseVerified,
            isPending: licensePending,
            actionText: t("verificationStatus.upload"),
            icon: <BadgeRoundedIcon sx={{ fontSize: 15 }} />,
            onClick: onUploadLicense,
          },
        ]
      : []),
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
        {t("verificationStatus.title")}
      </Typography>
      <Divider sx={{ mb: 1, borderColor: "border.light" }} />
      <List disablePadding>
        {items.map((item, index) => (
          <VerificationItem
            key={item.label}
            label={item.label}
            isVerified={item.isVerified}
            isPending={item.isPending}
            actionText={item.actionText}
            icon={item.icon}
            isLast={index === items.length - 1}
            onClick={item.onClick}
            pendingLabel={t("verificationStatus.pending")}
            verifiedLabel={t("verificationStatus.verified")}
          />
        ))}
      </List>
    </Box>
  );
}

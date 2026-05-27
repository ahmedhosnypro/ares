import { Box, Chip, Divider, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";

interface VerificationStatusProps {
  readonly emailVerified: boolean;
  readonly phoneVerified: boolean;
  readonly licenseVerified: boolean;
  readonly kycStatus?: string;
}

interface VerificationItemProps {
  readonly label: string;
  readonly isVerified: boolean;
  readonly isPending?: boolean;
  readonly actionText: string;
  readonly icon: React.ReactNode;
  readonly isLast: boolean;
}

function VerificationItem({ label, isVerified, isPending, actionText, icon, isLast }: VerificationItemProps) {
  return (
    <>
      <ListItem
        sx={{ px: 0, py: 1.5 }}
        secondaryAction={
          isPending ? (
            <Chip
              label="Pending Approval"
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
              clickable
              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
            />
          ) : (
            <Chip
              label="Verified"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
            />
          )
        }
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
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
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>{icon}</Box>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
            </Box>
          }
        />
      </ListItem>
      {!isLast && <Divider sx={{ borderColor: "border.light" }} />}
    </>
  );
}

export default function VerificationStatus({
  emailVerified,
  phoneVerified,
  licenseVerified,
  kycStatus,
}: VerificationStatusProps) {
  const items = [
    {
      label: "Email Address",
      isVerified: emailVerified,
      isPending: false,
      actionText: "Verify",
      icon: <EmailRoundedIcon sx={{ fontSize: 15 }} />,
    },
    {
      label: "Phone Number",
      isVerified: phoneVerified,
      isPending: false,
      actionText: "Verify",
      icon: <PhoneRoundedIcon sx={{ fontSize: 15 }} />,
    },
    {
      label: "Identity Verification",
      isVerified: kycStatus?.toLowerCase() === "approved",
      isPending: kycStatus?.toLowerCase() === "pending",
      actionText: "Verify",
      icon: <BadgeRoundedIcon sx={{ fontSize: 15 }} />,
    },
    {
      label: "Driver's License",
      isVerified: licenseVerified,
      isPending: false,
      actionText: "Upload",
      icon: <BadgeRoundedIcon sx={{ fontSize: 15 }} />,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
        Verification Status
      </Typography>
      <Divider sx={{ mb: 1, borderColor: "border.light" }} />
      <List disablePadding>
        {items.map((item, index) => (
          <VerificationItem
            key={item.label}
            label={item.label}
            isVerified={item.isVerified}
            actionText={item.actionText}
            icon={item.icon}
            isLast={index === items.length - 1}
          />
        ))}
      </List>
    </Box>
  );
}

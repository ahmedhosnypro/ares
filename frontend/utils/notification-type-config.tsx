import type { SxProps, Theme } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

export type NotificationTypeConfig = {
  icon: React.ElementType;
  avatarSx: SxProps<Theme>;
};

const DEFAULT_CONFIG: NotificationTypeConfig = {
  icon: NotificationsActiveIcon,
  avatarSx: {
    bgcolor: "action.hover",
    color: "text.secondary",
  },
};

const TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  DriverEarningReceived: {
    icon: AttachMoneyIcon,
    avatarSx: {
      bgcolor: "success.light",
      color: "success.main",
    },
  },
  DriverPayoutCompleted: {
    icon: CheckCircleIcon,
    avatarSx: {
      bgcolor: "success.light",
      color: "success.main",
    },
  },
  DriverPayoutRejected: {
    icon: ErrorOutlinedIcon,
    avatarSx: {
      bgcolor: "error.light",
      color: "error.main",
    },
  },
};

export function getNotificationTypeConfig(type: string | null | undefined): NotificationTypeConfig {
  if (!type) return DEFAULT_CONFIG;
  const tag = type.split(":")[0];
  return TYPE_CONFIG[tag] ?? DEFAULT_CONFIG;
}

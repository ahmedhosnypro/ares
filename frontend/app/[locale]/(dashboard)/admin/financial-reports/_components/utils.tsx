import { Theme } from "@mui/material/styles";
import {
  CreditCard as CardIcon,
  AttachMoney as CashIcon,
  AccountBalanceWallet as WalletIcon,
  AccountBalance as BankIcon,
} from "@mui/icons-material";

export const getStatusColor = (theme: Theme, statusName: string) => {
  switch (statusName.toLowerCase()) {
    case "completed":
    case "paid":
    case "captured":
      return theme.palette.status.completed;
    case "active":
    case "authorized":
      return theme.palette.status.active;
    case "pending":
    case "pending payment":
    case "paymentpending":
      return theme.palette.status.pending;
    case "cancelled":
    case "failed":
    case "refunded":
      return theme.palette.status.cancelled;
    default:
      return theme.palette.status.pending;
  }
};

export const getMethodIcon = (theme: Theme, method: string) => {
  switch (method.toLowerCase()) {
    case "card":
    case "visa":
    case "visa / card":
      return <CardIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />;
    case "cash":
      return <CashIcon sx={{ color: theme.palette.status.active.main, fontSize: 16 }} />;
    case "wallet":
      return <WalletIcon sx={{ color: theme.palette.secondary.main, fontSize: 16 }} />;
    case "bank":
    case "bank transfer":
      return <BankIcon sx={{ color: theme.palette.status.confirmed.main, fontSize: 16 }} />;
    default:
      return <CardIcon sx={{ color: theme.palette.text.secondary, fontSize: 16 }} />;
  }
};

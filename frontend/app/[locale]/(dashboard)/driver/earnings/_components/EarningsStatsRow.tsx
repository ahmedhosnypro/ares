"use client";

import { useMemo } from "react";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import VehicleStats, { type StatItem } from "@/app/[locale]/(dashboard)/_components/VehicleStats";
import type { DriverEarningsStats } from "@/api-clients/driver-earnings/driver-earnings";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

interface EarningsStatsRowProps {
  readonly stats: DriverEarningsStats | null;
  readonly loading: boolean;
  readonly labels: {
    readonly totalEarnings: string;
    readonly thisMonth: string;
    readonly lastMonth: string;
    readonly availableBalance: string;
  };
}

export default function EarningsStatsRow({ stats, loading, labels }: EarningsStatsRowProps) {
  const items = useMemo<readonly StatItem[]>(
    () => [
      {
        label: labels.totalEarnings,
        value: stats ? formatCurrency(safeNum(stats.totalEarnings)) : "—",
        subtitle: "Lifetime, completed trips",
        icon: <AttachMoneyIcon fontSize="medium" />,
        color: "success",
      },
      {
        label: labels.thisMonth,
        value: stats ? formatCurrency(safeNum(stats.thisMonthEarnings)) : "—",
        subtitle: "Earnings this calendar month",
        icon: <CalendarMonthIcon fontSize="medium" />,
        color: "primary",
      },
      {
        label: labels.lastMonth,
        value: stats ? formatCurrency(safeNum(stats.lastMonthEarnings)) : "—",
        subtitle: "Earnings previous calendar month",
        icon: <HistoryIcon fontSize="medium" />,
        color: "info",
      },
      {
        label: labels.availableBalance,
        value: stats ? formatCurrency(safeNum(stats.availableBalance)) : "—",
        subtitle: "Available for withdrawal",
        icon: <AccountBalanceWalletIcon fontSize="medium" />,
        color: "warning",
      },
    ],
    [stats, labels]
  );

  return <VehicleStats items={items} loading={loading} sx={{ mb: 3 }} />;
}

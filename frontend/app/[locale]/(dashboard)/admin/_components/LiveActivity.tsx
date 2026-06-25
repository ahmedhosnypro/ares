"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  IconButton,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PaymentIcon from "@mui/icons-material/Payment";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useSession } from "next-auth/react";
import { apiFetchJson, ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { getAdminVerifications } from "@/api-clients/admin-verifications/admin-verifications";

// ── Shape from GET /api/dashboard/recent-summary ──────────────────────────────
interface RecentActivityItem {
  type: "booking" | "payment" | "user" | "vehicle" | "verification";
  message: string;
  createdAt: string; // ISO-8601 UTC — always a real DB timestamp
  icon: string;
}

// ── Fallback: shapes from existing APIs ───────────────────────────────────────
interface RawBooking {
  id?: string | number;
  bookingNumber?: string;
  status?: string;
  car?: { name?: string };
  createdAt?: string;
  updatedAt?: string;
  from?: string;
}

interface RawUser {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: string;
}

interface RawVehicle {
  vehicleId?: string;
  id?: string | number;
  make?: string;
  model?: string;
  createdAt?: string;
}

interface AnyPagedResponse<T> {
  data?: T[];
  resultData?: T[];
  items?: T[];
}

// ── Icon / color map ─────────────────────────────────────────────────────────
const TYPE_META: Record<
  RecentActivityItem["type"],
  { color: "primary" | "success" | "warning" | "info"; icon: React.ReactNode }
> = {
  booking: { color: "primary", icon: <EventAvailableIcon fontSize="small" /> },
  payment: { color: "success", icon: <PaymentIcon fontSize="small" /> },
  user: { color: "info", icon: <PersonAddIcon fontSize="small" /> },
  vehicle: { color: "warning", icon: <DirectionsCarIcon fontSize="small" /> },
  verification: { color: "success", icon: <VerifiedIcon fontSize="small" /> },
};

// ── Timestamp display ─────────────────────────────────────────────────────────
function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "–";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "–";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const isToday =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

  if (isToday) {
    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes.toString()} min ago`;
    return `${hours.toString()} hr ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

// ── Fallback helpers ──────────────────────────────────────────────────────────
const extractRows = <T,>(res: AnyPagedResponse<T> | null): T[] => res?.data ?? res?.resultData ?? [];

const bestBookingTs = (b: RawBooking): string | undefined => b.createdAt ?? (b.from ? b.from : undefined);

const bestPaymentTs = (b: RawBooking): string | undefined =>
  b.updatedAt ?? b.createdAt ?? (b.from ? b.from : undefined);

// ── Fallback: build single most-recent event from existing working APIs ───────
async function fetchViaFallbackApis(
  accessToken: string,
  isSupplier: boolean,
  userId: string
): Promise<RecentActivityItem[]> {
  const [bookingsRes, usersRes, vehiclesRes, verificationsRes] = await Promise.all([
    apiFetchJson<AnyPagedResponse<RawBooking>>("api/admin/bookings/search/1/10", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        userId: null,
        suppliers: isSupplier ? [userId] : null,
        statuses: null,
        carId: null,
        filter: { from: null, to: null, keyword: null, pickupLocation: null, dropOffLocation: null },
        page: 1,
        size: 10,
        language: "en",
      }),
    }).catch((e: unknown) => {
      logger.error("LiveActivity fallback: bookings", e);
      return null;
    }),

    apiFetchJson<AnyPagedResponse<RawUser>>("api/admin/users/1/10", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ keyword: null, types: ["user"] }),
    }).catch((e: unknown) => {
      logger.error("LiveActivity fallback: users", e);
      return null;
    }),

    apiFetchJson<AnyPagedResponse<RawVehicle>>("api/vehicles/search/1/10", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ suppliers: null, keyword: null }),
    }).catch((e: unknown) => {
      logger.error("LiveActivity fallback: vehicles", e);
      return null;
    }),

    isSupplier
      ? Promise.resolve({ data: [] })
      : getAdminVerifications(1, 1).catch((e: unknown) => {
          logger.error("LiveActivity fallback: verifications", e);
          return { data: [] };
        }),
  ]);

  const latestByType = new Map<RecentActivityItem["type"], RecentActivityItem>();

  const keepLatest = (item: RecentActivityItem) => {
    const prev = latestByType.get(item.type);
    if (!prev || new Date(item.createdAt) > new Date(prev.createdAt)) {
      latestByType.set(item.type, item);
    }
  };

  // ── Bookings + Payment ────────────────────────────────────────────────────
  const bookings = extractRows(bookingsRes);
  for (const b of bookings) {
    const rawId = String(b.id ?? "");
    const shortId = (b.bookingNumber ?? rawId.substring(0, 6)).toUpperCase() || "–";
    const carName = b.car?.name ?? "";

    const bTs = bestBookingTs(b);
    keepLatest({
      type: "booking",
      message: carName ? `Booking for ${carName} created` : `Booking #${shortId} created`,
      createdAt: bTs ?? "",
      icon: "booking",
    });

    const isPaid = b.status === "Completed" || b.status === "Confirmed";
    if (isPaid) {
      const pTs = bestPaymentTs(b);
      keepLatest({
        type: "payment",
        message: carName ? `Payment completed for ${carName}` : `Payment completed for Booking #${shortId}`,
        createdAt: pTs ?? "",
        icon: "payment",
      });
    }
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  const users = extractRows(usersRes);
  for (const u of users) {
    const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "New user";
    keepLatest({
      type: "user",
      message: `New user registered: ${fullName}`,
      createdAt: u.createdAt ?? "",
      icon: "user",
    });
    break;
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const vehicles = extractRows(vehiclesRes);
  for (const v of vehicles) {
    const label = [v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
    keepLatest({
      type: "vehicle",
      message: `Vehicle ${label} added`,
      createdAt: v.createdAt ?? "",
      icon: "vehicle",
    });
    break;
  }

  // ── Verifications ────────────────────────────────────────────────────────
  const verifications = extractRows(verificationsRes);
  for (const v of verifications) {
    const fullName = `${v.userFirstName} ${v.userLastName}`.trim() || v.userEmail || "New verification";
    const statusLabel = v.status || "Pending";
    keepLatest({
      type: "verification",
      message: `Verification submitted by ${fullName} (${statusLabel})`,
      createdAt: v.submittedAt,
      icon: "verification",
    });
    break;
  }

  return [...latestByType.values()].sort(
    (a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LiveActivity({ activities: _ }: { readonly activities?: readonly unknown[] } = {}) {
  const theme = useTheme();
  const { data: session } = useSession();

  const [items, setItems] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadActivity = useCallback(async (): Promise<RecentActivityItem[]> => {
    if (!session?.accessToken) return [];

    try {
      const data = await apiFetchJson<RecentActivityItem[]>("api/dashboard/recent-summary", {
        accessToken: session.accessToken,
      });
      if (!Array.isArray(data)) return [];
      const byType = new Map<RecentActivityItem["type"], RecentActivityItem>();
      for (const item of data) {
        const prev = byType.get(item.type);
        if (!prev || new Date(item.createdAt) > new Date(prev.createdAt)) {
          byType.set(item.type, item);
        }
      }
      return [...byType.values()].sort(
        (a, b) =>
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      );
    } catch (err: unknown) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status !== 404) {
        throw err;
      }
      logger.warn("LiveActivity: /recent-summary not yet available, using fallback");
    }

    const user = session.user;
    const isSupplier = user.roles.includes("Supplier");
    const userId = user.id;
    return fetchViaFallbackApis(session.accessToken, isSupplier, userId);
  }, [session?.accessToken, session?.user]);

  const fetchActivity = useCallback(() => {
    setLoading(true);
    setError(false);
    loadActivity()
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        logger.error("LiveActivity: load failed", err);
        setError(true);
        setLoading(false);
      });
  }, [loadActivity]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchActivity();
    }
  }, [session?.accessToken, fetchActivity]);

  const handleRefresh = fetchActivity;

  const renderBody = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}>
          <CircularProgress size={26} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 180,
            gap: 1,
          }}
        >
          <Typography color="error" variant="body2" sx={{ fontWeight: 500 }}>
            Failed to load recent activity.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={handleRefresh}
          >
            Try again
          </Typography>
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}>
          <Typography color="text.secondary" variant="body2">
            No recent activity available.
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={0.5}>
        {items.map((item, idx) => {
          const meta = TYPE_META[item.type];
          const colorMain = theme.palette[meta.color].main;

          return (
            <Box
              key={`${item.type}-${idx.toString()}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1,
                px: 1,
                borderRadius: 2,
                transition: "background 0.15s ease",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: alpha(colorMain, 0.1),
                  color: colorMain,
                  flexShrink: 0,
                }}
              >
                {meta.icon}
              </Avatar>

              <Box
                sx={{
                  minWidth: 0,
                  flexGrow: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.84rem",
                    color: "text.primary",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.message}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  {formatTimestamp(item.createdAt)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    );
  };

  return (
    <Card
      elevation={0}
      sx={t => ({
        borderRadius: 2,
        border: "1px solid",
        borderColor: t.palette.border.main,
        height: "100%",
        boxShadow: t.palette.shadow.card,
        overflow: "hidden",
      })}
    >
      <CardContent sx={{ p: 2.5, height: "100%", "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "1rem" }}>
            Recent Activity
          </Typography>
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh recent activity"
            sx={{ transition: "transform 0.25s ease", "&:hover": { transform: "rotate(90deg)" } }}
          >
            <RefreshIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        </Box>

        {renderBody()}
      </CardContent>
    </Card>
  );
}

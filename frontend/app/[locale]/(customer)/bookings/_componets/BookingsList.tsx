"use client";

import { useState, useEffect, useCallback } from "react";
import { Alert, Box, Button, CircularProgress, Pagination, Typography } from "@mui/material";
import { DirectionsCar as CarIcon, CalendarMonth as CalendarIcon } from "@mui/icons-material";
import Link from "next/link";
import BookingCard, { type BookingItem } from "./BookingCard";
import BookingFilters from "./BookingFilters";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

// ── API response shapes (camelCase — ASP.NET Core default JSON output) ────────

interface RawLocation {
  readonly id?: string;
  readonly name?: string;
}

interface RawCar {
  readonly id?: string;
  readonly name?: string;
  readonly image?: string;
}

interface RawSupplier {
  readonly id?: string;
  readonly fullName?: string;
}

interface RawBooking {
  readonly id?: string;
  readonly car?: RawCar;
  readonly supplier?: RawSupplier;
  readonly pickupLocation?: RawLocation;
  readonly dropOffLocation?: RawLocation;
  readonly from?: string;
  readonly to?: string;
  readonly price?: number;
  readonly status?: string;
}

interface PagedHistoryResponse {
  readonly data?: readonly RawBooking[];
  readonly totalCount?: number;
}

// ── normalizer ────────────────────────────────────────────────────────────────

function normalizeBooking(raw: RawBooking): BookingItem {
  return {
    id: raw.id,
    car: raw.car ? { id: raw.car.id, name: raw.car.name, image: raw.car.image } : undefined,
    supplier: raw.supplier ? { id: raw.supplier.id, fullName: raw.supplier.fullName } : undefined,
    pickupLocation: raw.pickupLocation ? { id: raw.pickupLocation.id, name: raw.pickupLocation.name } : undefined,
    dropOffLocation: raw.dropOffLocation ? { id: raw.dropOffLocation.id, name: raw.dropOffLocation.name } : undefined,
    from: raw.from,
    to: raw.to,
    price: raw.price,
    status: raw.status,
  };
}

// ── component ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

export default function BookingsList({ userId, accessToken }: Readonly<{ userId: string; accessToken: string }>) {
  const [bookings, setBookings] = useState<readonly BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEverBooked, setHasEverBooked] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeStatuses, setActiveStatuses] = useState<readonly string[]>([
    "Draft",
    "PaymentPending",
    "Confirmed",
    "Active",
    "Completed",
    "Cancelled",
  ]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: check if user has any bookings at all
      if (hasEverBooked === null) {
        const checkRes = await fetch(toApiUrl(`/api/has-bookings/${userId}`), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (checkRes.status === 204) {
          setHasEverBooked(false);
          setLoading(false);
          return;
        }
        setHasEverBooked(true);
      }

      // Step 2: fetch paginated bookings
      const statusParam = activeStatuses.join(",");
      const searchParam = searchKeyword !== "" ? searchKeyword : "";

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        status: statusParam,
        sortBy,
        sortOrder,
      });
      if (searchParam) {
        queryParams.append("search", searchParam);
      }

      const res = await fetch(toApiUrl(`/api/bookings/history?${queryParams.toString()}`), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load bookings (${String(res.status)})`);
      }

      const data = (await res.json()) as PagedHistoryResponse;
      setBookings((data.data ?? []).map(normalizeBooking));
      setTotalRecords(data.totalCount ?? 0);
    } catch (err) {
      logger.error("Fetch bookings error", err);
      setError("Unable to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, userId, accessToken, activeStatuses, searchKeyword, sortBy, sortOrder, hasEverBooked]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleFilterChange = useCallback(
    (statuses: readonly string[], keyword: string, newSortBy: string, newSortOrder: string) => {
      setActiveStatuses(statuses);
      setSearchKeyword(keyword);
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      setPage(1);
    },
    []
  );

  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <BookingFilters onFilterChange={handleFilterChange} />
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      </Box>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <BookingFilters onFilterChange={handleFilterChange} />
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                void fetchBookings();
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // ── Never booked (zero state) ────────────────────────────────────────────────
  if (hasEverBooked === false) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: { xs: 10, sm: 16 },
          px: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "border.main",
          bgcolor: "background.paper",
          boxShadow: "shadow.card",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <CarIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography
          variant="h5"
          color="text.primary"
          gutterBottom
          sx={{
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            fontWeight: 800,
          }}
        >
          Ready for your first trip?
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 400,
            mx: "auto",
            mb: 4,
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          You haven&apos;t made any reservations yet. Browse our premium collection of vehicles and start your journey
          today.
        </Typography>
        <Button component={Link} href="/vehicles" variant="contained" size="large">
          Browse Vehicles
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <BookingFilters onFilterChange={handleFilterChange} />

      {/* No results after filtering */}
      {bookings.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 12,
            borderRadius: 2,
            border: "2px dashed",
            borderColor: "border.main",
            bgcolor: "background.paper",
          }}
        >
          <CalendarIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography
            variant="h6"
            color="text.primary"
            gutterBottom
            sx={{
              fontSize: { xs: "1rem", sm: "1.125rem" },
              fontWeight: 700,
            }}
          >
            No matches found
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Try adjusting your filters or searching for something else.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {bookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </Box>

          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                border: "1px solid",
                borderColor: "border.main",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  textAlign: "center",
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                }}
              >
                Showing{" "}
                <Typography component="span" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {(page - 1) * PAGE_SIZE + 1}
                </Typography>
                {" – "}
                <Typography component="span" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {Math.min(page * PAGE_SIZE, totalRecords)}
                </Typography>
                {" of "}
                <Typography component="span" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {totalRecords}
                </Typography>
                {" bookings"}
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => {
                  setPage(value);
                }}
                color="primary"
                shape="rounded"
                size="medium"
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                    minWidth: { xs: 28, md: 32 },
                    height: { xs: 28, md: 32 },
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

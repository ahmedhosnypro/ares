import { useState, useEffect } from "react";
import { apiFetchJson, ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

// ── Wire types ────────────────────────────────────────────────────────────────

export interface SupplierBookingListItemDto {
  id: string;
  bookingId?: string;
  bookingNumber?: string;
  customerName?: string;
  vehicleId?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleImageUrl?: string;
  pickupDate?: string;
  returnDate?: string;
  totalPrice?: number;
  bookingStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
}

export interface PagedResult<T> {
  data?: T[];
  items?: T[];
  resultData?: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageInfo?: Array<{ totalRecords: number }>;
}

interface RawSupplierBookingListItem extends Omit<SupplierBookingListItemDto, "id"> {
  id?: string;
}

interface UseSupplierBookingsResult {
  bookings: SupplierBookingListItemDto[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Your session has expired. Please sign in again.";
    if (err.status === 403) return "You don't have permission to view bookings.";
    return `Failed to load bookings (${String(err.status)}).`;
  }
  if (err instanceof Error) return err.message;
  return "Failed to load bookings.";
}

function normalizeRows(raw: RawSupplierBookingListItem[]): SupplierBookingListItemDto[] {
  return raw.map(item => ({
    ...item,
    id: item.bookingId ?? item.id ?? "",
  }));
}

// ── List hook ─────────────────────────────────────────────────────────────────

export const useSupplierBookings = (
  accessToken: string | undefined,
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  bookingStatus: string = "",
  paymentStatus: string = ""
): UseSupplierBookingsResult => {
  const [bookings, setBookings] = useState<SupplierBookingListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (bookingStatus && bookingStatus !== "All") params.set("bookingStatus", bookingStatus);
        if (paymentStatus && paymentStatus !== "All") params.set("paymentStatus", paymentStatus);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const responseData = await apiFetchJson<PagedResult<RawSupplierBookingListItem>>(
          `/api/supplier/bookings?${params.toString()}`,
          { method: "GET", accessToken }
        );

        if (cancelled) return;

        const rawItems = responseData.data ?? responseData.items ?? responseData.resultData ?? [];
        const items = normalizeRows(rawItems);

        const resolvedTotalCount = responseData.totalCount ?? responseData.pageInfo?.[0]?.totalRecords ?? 0;
        const resolvedTotalPages = responseData.totalPages ?? Math.ceil(resolvedTotalCount / pageSize);

        setBookings(items);
        setTotalCount(resolvedTotalCount);
        setTotalPages(resolvedTotalPages);
      } catch (err) {
        if (cancelled) return;
        logger.error("Error fetching supplier bookings", err);
        setBookings([]);
        setTotalCount(0);
        setTotalPages(0);
        setError(readErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const delay = search.trim().length > 0 ? 300 : 0;
    const timer = setTimeout(() => {
      void fetchBookings();
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [accessToken, page, pageSize, search, bookingStatus, paymentStatus]);

  return { bookings, loading, error, totalPages, totalCount };
};

// ── Details ───────────────────────────────────────────────────────────────────

export interface SupplierBookingDetailsDto {
  id: string;
  bookingId?: string;
  bookingNumber?: string;
  createdAt?: string;
  pickupDate?: string;
  returnDate?: string;
  totalDays?: number;
  totalPrice?: number;
  status?: string;
  pickupLocation?: { id?: string; name?: string };
  dropOffLocation?: { id?: string; name?: string };
  customer?: { id?: string; name?: string; email?: string; phone?: string };
  vehicle?: {
    id?: string;
    make?: string;
    model?: string;
    year?: number;
    licensePlate?: string;
    primaryImageUrl?: string;
  };
  payment?: {
    latestKnownStatus?: string;
    paymentMethod?: string;
    amount?: number;
    currency?: string;
    processedTimestamp?: string;
  };
}

export interface FlatSupplierBookingDetailsDto {
  bookingId: string;
  bookingNumber?: string;
  createdAt?: string;
  pickupDate?: string;
  returnDate?: string;
  totalDays?: number;
  totalPrice?: number;
  bookingStatus?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  vehicleId: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleLicensePlate?: string;
  vehicleImageUrl?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProcessedAt?: string;
}

export async function getSupplierBookingById(accessToken: string, id: string): Promise<SupplierBookingDetailsDto> {
  const flatData = await apiFetchJson<FlatSupplierBookingDetailsDto>(`/api/supplier/bookings/${id}`, {
    method: "GET",
    accessToken,
  });

  return {
    id: flatData.bookingId,
    bookingId: flatData.bookingId,
    bookingNumber: flatData.bookingNumber,
    createdAt: flatData.createdAt,
    pickupDate: flatData.pickupDate,
    returnDate: flatData.returnDate,
    totalDays: flatData.totalDays,
    totalPrice: flatData.totalPrice,
    status: flatData.bookingStatus,
    pickupLocation: flatData.pickupLocation ? { name: flatData.pickupLocation } : undefined,
    dropOffLocation: flatData.dropoffLocation ? { name: flatData.dropoffLocation } : undefined,
    customer: {
      id: flatData.customerId,
      name: flatData.customerName,
      email: flatData.customerEmail,
      phone: flatData.customerPhone,
    },
    vehicle: {
      id: flatData.vehicleId,
      make: flatData.vehicleMake,
      model: flatData.vehicleModel,
      year: flatData.vehicleYear,
      licensePlate: flatData.vehicleLicensePlate,
      primaryImageUrl: flatData.vehicleImageUrl,
    },
    payment: {
      latestKnownStatus: flatData.paymentStatus,
      paymentMethod: flatData.paymentMethod,
      amount: flatData.paymentAmount,
      currency: flatData.paymentCurrency,
      processedTimestamp: flatData.paymentProcessedAt,
    },
  };
}

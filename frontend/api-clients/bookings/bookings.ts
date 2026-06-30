import { useState, useEffect } from "react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface BookingCustomer {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  isEmailVerified?: boolean;
  verificationStatus?: string | null;
}

export interface BookingInspectionOverview {
  preInspectionStatus?: string | null;
  postInspectionStatus?: string | null;
  assignedInspectorId?: string | null;
  assignedInspectorName?: string | null;
  preInspectionDate?: string | null;
  postInspectionDate?: string | null;
}

export interface BookingInspectionFull {
  inspectionId: string;
  inspectionType: string; // Pickup | Return
  inspectorId: string;
  inspectorName: string;
  status: string;
  inspectionDate: string;
  submittedAt?: string | null;
  isSubmitted: boolean;
  odometerReading: number;
  fuelLevel: number;
  generalCondition?: string | null;
  notes?: string | null;
  imageUrls: string[];
}

export interface BookingPaymentDetails {
  paymentId: string;
  transactionId?: string | null;
  method: string;
  amount: number;
  currency: string;
  status: string;
  authorizationCode?: string | null;
  processedAt?: string | null;
  failureReason?: string | null;
  createdAt?: string | null;
  refundAmount?: number | null;
  refundStatus?: string | null;
  refundProcessedAt?: string | null;
  refundMethod?: string | null;
}

export interface BookingTimelineEvent {
  type: string;
  title: string;
  description?: string | null;
  occurredAt: string;
}

export interface Booking {
  id: string;
  bookingNumber?: string;
  customerName?: string;
  customer?: BookingCustomer | null;
  totalDays?: number;
  status: string;
  driverAssignmentStatus?: string;
  inspectionStatus?: string;
  price?: number;
  dailyRate?: number | null;
  paymentStatus?: string;
  paymentMethod?: string;
  supplier?: {
    id: string;
    name: string;
    fullName?: string;
    email?: string;
    phone?: string | null;
    companyName?: string | null;
  };
  car?: {
    id: string;
    name: string;
    image: string;
    plateNumber?: string;
    dailyRate?: number | null;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    availabilityStatus?: string | null;
    supplier?: {
      id: string;
      name?: string | null;
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
      companyName?: string | null;
    };
  };
  driver?: {
    id: string;
    fullName: string;
    phone?: string;
  };
  pickupLocation?: {
    id: string;
    name: string;
  };
  dropOffLocation?: {
    id: string;
    name: string;
  };
  from: string;
  to: string;
  payLater?: boolean;
  inspection?: BookingInspectionOverview | null;
  pickupInspection?: BookingInspectionFull | null;
  returnInspection?: BookingInspectionFull | null;
  paymentDetails?: BookingPaymentDetails | null;
  timeline?: BookingTimelineEvent[] | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

interface BookingResponse {
  resultData?: Booking[];
  data?: Booking[];
  items?: Booking[];
  pageInfo?: Array<{ totalRecords: number }>;
  totalCount?: number;
  totalPages?: number;
}

export const useBookings = (
  accessToken: string | undefined,
  user: { id: string; role: string } | undefined,
  page: number = 0,
  size: number = 10,
  searchKeyword: string = "",
  statusFilter: string = "All",
  fromDate: string | null = null,
  toDate: string | null = null,
  initialData?: { bookings: Booking[]; totalCount: number; totalPages: number }
) => {
  const [bookings, setBookings] = useState<Booking[]>(initialData?.bookings || []);
  const [loading, setLoading] = useState(initialData ? false : true);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isInitialMount, setIsInitialMount] = useState(true);

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (initialData && isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    const fetchBookings = async () => {
      if (!accessToken || !user) return;

      setLoading(true);
      try {
        const payload = {
          userId: null,
          suppliers: user.role === "Supplier" ? [user.id] : null,
          statuses: statusFilter === "All" ? null : [statusFilter],
          carId: null,
          filter: {
            from: fromDate,
            to: toDate,
            keyword: searchKeyword || null,
            pickupLocation: null,
            dropOffLocation: null,
          },
          page: page + 1,
          size: size,
          language: "en",
        };

        const responseData = await apiFetchJson<BookingResponse>(
          `/api/admin/bookings/search/${String(page + 1)}/${String(size)}`,
          {
            method: "POST",
            body: JSON.stringify(payload),
            accessToken: accessToken,
          }
        );

        setBookings(responseData.resultData || responseData.data || responseData.items || []);
        setTotalCount(responseData.pageInfo?.[0]?.totalRecords || responseData.totalCount || 0);
        setTotalPages(responseData.totalPages || Math.ceil((responseData.totalCount || 0) / size) || 1);
      } catch (error) {
        logger.error("Error fetching bookings", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      void fetchBookings();
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [
    accessToken,
    user,
    page,
    size,
    searchKeyword,
    statusFilter,
    fromDate,
    toDate,
    refreshTrigger,
    initialData,
    isInitialMount,
  ]);
  return { bookings, loading, totalPages, totalCount, refetch };
};

export interface AdminBookingStats {
  activeBookings: number;
  pendingBookings: number;
  totalCompletedBookings: number;
  // Backward-compat aliases that the backend may emit on older builds.
  completedBookings?: number;
  completedToday?: number;
}

// ─── Picker DTOs ─────────────────────────────────────────────────────────
export interface CustomerPickerItem {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  hasApprovedLicense?: boolean;
}

export interface VehiclePickerItem {
  id: string;
  name: string;
  thumbnail?: string | null;
  plateNumber?: string | null;
  dailyRate?: number | null;
  supplierName?: string | null;
}

/**
 * Searchable customer picker for the create-booking flow.
 * Server filters by search term and returns the top N customers.
 */
export async function searchCustomersPicker(
  accessToken: string,
  search: string,
  limit = 20,
  signal?: AbortSignal
): Promise<CustomerPickerItem[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  params.set("limit", String(limit));
  return apiFetchJson<CustomerPickerItem[]>(`/api/admin/bookings/pickers/customers?${params.toString()}`, {
    method: "GET",
    accessToken,
    signal,
  });
}

/**
 * Searchable available-vehicles picker. The server only returns vehicles
 * that are active AND not overlapping any active booking for the given
 * window, so the UI can render results directly.
 */
export async function searchAvailableVehiclesPicker(
  accessToken: string,
  args: {
    search?: string;
    pickupDate?: string;
    returnDate?: string;
    customerUserId?: string;
    pickupLocationId?: string;
    limit?: number;
  },
  signal?: AbortSignal
): Promise<VehiclePickerItem[]> {
  const params = new URLSearchParams();
  if (args.search?.trim()) params.set("search", args.search.trim());
  if (args.pickupDate) params.set("pickupDate", args.pickupDate);
  if (args.returnDate) params.set("returnDate", args.returnDate);
  if (args.customerUserId) params.set("customerUserId", args.customerUserId);
  if (args.pickupLocationId) params.set("pickupLocationId", args.pickupLocationId);
  params.set("limit", String(args.limit ?? 20));
  return apiFetchJson<VehiclePickerItem[]>(`/api/admin/bookings/pickers/vehicles?${params.toString()}`, {
    method: "GET",
    accessToken,
    signal,
  });
}

export interface DriverPickerItem {
  driverProfileId: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  averageRating: number;
  totalTrips: number;
  experienceYears: number;
  driverFee: number;
}

export interface AvailableDriversResponse {
  drivers: DriverPickerItem[];
  nearbyUnavailableCount: number;
}

/**
 * Searchable available-drivers picker. Uses the checkout endpoint to find
 * available drivers for the specified window.
 */
export async function searchAvailableDriversPicker(
  accessToken: string,
  args: {
    pickupDate: string;
    returnDate: string;
    bookingId?: string;
  },
  signal?: AbortSignal
): Promise<AvailableDriversResponse> {
  const params = new URLSearchParams();
  params.set("pickupDate", args.pickupDate);
  params.set("returnDate", args.returnDate);
  if (args.bookingId) params.set("bookingId", args.bookingId);
  return apiFetchJson<AvailableDriversResponse>(`/api/checkout/drivers?${params.toString()}`, {
    method: "GET",
    accessToken,
    signal,
  });
}

/**
 * Fetch a single booking's details (admin view).
 */
export async function getAdminBookingDetails(accessToken: string, bookingId: string): Promise<Booking> {
  return apiFetchJson<Booking>(`/api/admin/bookings/${bookingId}`, {
    method: "GET",
    accessToken,
  });
}

/**
 * Partially update a booking's editable fields (dates, locations, status).
 * Returns the refreshed booking details.
 */
export async function updateBooking(
  accessToken: string,
  bookingId: string,
  payload: {
    pickupDate?: string;
    returnDate?: string;
    pickupLocation?: string;
    dropOffLocation?: string;
    status?: string;
  }
): Promise<Booking> {
  return apiFetchJson<Booking>(`/api/admin/bookings/${bookingId}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

/**
 * Operational status update. Backed by the existing
 * `PUT /api/admin/bookings/{id}/status` endpoint.
 */
export async function updateBookingStatus(
  accessToken: string,
  bookingId: string,
  status: string,
  remarks?: string
): Promise<void> {
  await apiFetchJson(`/api/admin/bookings/${bookingId}/status`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify({ status, remarks: remarks ?? null }),
  });
}

export async function approveBooking(accessToken: string, bookingId: string): Promise<void> {
  await apiFetchJson(`/api/admin/booking-approvals/${bookingId}/approve`, {
    method: "PATCH",
    accessToken,
  });
}

export async function rejectBooking(accessToken: string, bookingId: string, reason: string): Promise<void> {
  await apiFetchJson(`/api/admin/booking-approvals/${bookingId}/reject`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ reason }),
  });
}

/**
 * Delete one or more bookings via the bulk-delete endpoint.
 */
export async function deleteBookings(accessToken: string, ids: string[]): Promise<void> {
  await apiFetchJson(`/api/admin/bookings/delete-bookings`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ ids }),
  });
}

/**
 * Create a booking via the supported admin/customer flow.
 * The backend accepts both string-based locations and Guid-based IDs.
 */
export async function createBooking(
  accessToken: string,
  payload: {
    vehicleId: string;
    pickupDate: string;
    returnDate: string;
    pickupLocation?: string;
    dropOffLocation?: string;
    pickupLocationId?: string;
    dropOffLocationId?: string;
    driverId?: string | null;
    driverProfileId?: string | null;
    payLater?: boolean;
    customerUserId?: string;
    paymentMethod?: string;
  }
): Promise<{ bookingId: string; bookingNumber: string; status: string; totalPrice: number; message: string }> {
  return apiFetchJson(`/api/bookings/create`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      // Always provide both Guid placeholders and string labels so the
      // backend's flexible contract is satisfied either way.
      VehicleId: payload.vehicleId,
      PickupLocationId: payload.pickupLocationId ?? "00000000-0000-0000-0000-000000000000",
      DropOffLocationId: payload.dropOffLocationId ?? "00000000-0000-0000-0000-000000000000",
      PickupDate: payload.pickupDate,
      ReturnDate: payload.returnDate,
      DriverId: payload.driverId ?? null,
      DriverProfileId: payload.driverProfileId ?? null,
      PayLater: payload.payLater ?? false,
      PickupLocation: payload.pickupLocation ?? null,
      DropOffLocation: payload.dropOffLocation ?? null,
      CustomerUserId: payload.customerUserId ?? null,
      PaymentMethod: payload.paymentMethod ?? null,
    }),
  });
}

export async function calculateBookingPrice(
  accessToken: string,
  payload: {
    vehicleId: string;
    pickupDate: string;
    returnDate: string;
    driverProfileId?: string | null;
  }
): Promise<{ totalDays: number; vehicleFee: number; driverFee: number; grandTotal: number }> {
  return apiFetchJson(`/api/admin/bookings/calculate-price`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      VehicleId: payload.vehicleId,
      PickupDate: payload.pickupDate,
      ReturnDate: payload.returnDate,
      DriverProfileId: payload.driverProfileId ?? null,
    }),
  });
}

export const useAdminBookingStats = (
  accessToken: string | undefined,
  user: { id: string; role: string } | undefined
) => {
  const [stats, setStats] = useState<AdminBookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!accessToken || !user) return;

      setLoading(true);
      try {
        const responseData = await apiFetchJson<AdminBookingStats>(`/api/admin/bookings/stats`, {
          method: "GET",
          accessToken: accessToken,
        });
        setStats(responseData);
      } catch (error) {
        logger.error("Error fetching admin booking stats", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, [accessToken, user, refreshTrigger]);

  return { stats, loading, refetch };
};

export interface BookingStatusAnalytics {
  status: string;
  count: number;
}

export interface AdminBookingAnalytics {
  statusDistribution: BookingStatusAnalytics[];
  activeBookings: number;
  pickupQueue: number;
  returnQueue: number;
  upcomingPickups: number;
}

export const useAdminBookingAnalytics = (
  accessToken: string | undefined,
  user: { id: string; role: string } | undefined,
  initialData?: AdminBookingAnalytics
) => {
  const [analytics, setAnalytics] = useState<AdminBookingAnalytics | null>(initialData || null);
  const [loading, setLoading] = useState(initialData ? false : true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isInitialMount, setIsInitialMount] = useState(true);

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (initialData && isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    const fetchAnalytics = async () => {
      if (!accessToken || !user) return;

      setLoading(true);
      try {
        const responseData = await apiFetchJson<AdminBookingAnalytics>(`/api/admin/bookings/analytics`, {
          method: "GET",
          accessToken: accessToken,
        });
        setAnalytics(responseData);
      } catch (error) {
        logger.error("Error fetching admin booking analytics", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, [accessToken, user, refreshTrigger, initialData, isInitialMount]);

  return { analytics, loading, refetch };
};

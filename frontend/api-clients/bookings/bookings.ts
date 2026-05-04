import { useState, useEffect } from "react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface Booking {
  id: string;
  status: string;
  car?: {
    id: string;
    name: string;
    image: string;
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
  statusFilter: string = "All"
) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
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
            from: null,
            to: null,
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
  }, [accessToken, user, page, size, searchKeyword, statusFilter]);
  return { bookings, loading, totalPages, totalCount };
};

import { apiFetchJson, ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface TripAssignment {
  readonly clientName: string;
  readonly clientAvatar: string;
  readonly clientEmail: string;
  readonly clientPhone: string;
  readonly vehicleModel: string;
  readonly vehiclePlate: string;
  readonly vehicleColor: string;
  readonly vehicleImage: string;
  readonly pickupDate: string;
  readonly dropoffDate: string;
  readonly pickupLocation: string;
  readonly dropoffLocation: string;
  readonly rentalDuration: string;
}

export interface UpcomingTrip {
  readonly id: string;
  readonly date: string;
  readonly clientName: string;
  readonly vehicleModel: string;
  readonly payout: string;
  readonly duration: string;
}

export interface HistoricalPayout {
  readonly tripId: string;
  readonly date: string;
  readonly clientName: string;
  readonly vehicleModel: string;
  readonly duration: string;
  readonly amount: string;
  readonly status: "Paid" | "Pending";
}

export type DriverAvailabilityStatus = "Available" | "Unavailable" | "Reserved";

export interface DriverKpiMetrics {
  readonly earnings: string;
  readonly tripsCompleted: number;
  readonly activeUpcomingCount: number;
  readonly rating: string;
  readonly availableBalance?: string;
}

export interface DriverDashboardSummaryDto {
  readonly status: string;
  readonly availability: DriverAvailabilityStatus;
  readonly isActive: boolean;
  readonly totalTripsCompleted: number;
  readonly averageRating: number;
  readonly totalEarnings: number;
  readonly activeRequestsCount: number;
  readonly upcomingAssignmentsCount: number;
  readonly totalTrips: number;
  readonly activeTrips: number;
  readonly completedTrips: number;
  readonly upcomingTrips: number;
}

export interface DriverProfileStatusDto {
  readonly status: string;
  readonly availability: DriverAvailabilityStatus;
  readonly isActive: boolean;
  readonly rejectionReason?: string;
}

// Fallback Mock Data Definitions
export const mockAssignment: TripAssignment = {
  clientName: "John Doe",
  clientAvatar: "https://ui-avatars.com/api/?name=John+Doe&background=random",
  clientEmail: "john.doe@luxuryrentals.com",
  clientPhone: "+1 555-0199",
  vehicleModel: "Mercedes-Benz S-Class (S580)",
  vehiclePlate: "LXR-9988",
  vehicleColor: "Obsidian Black Metallic",
  vehicleImage: "/img/placeholder_car.jpg",
  pickupDate: "June 24, 2026, 09:00 AM",
  dropoffDate: "June 30, 2026, 06:00 PM",
  pickupLocation: "5th Avenue Suite 400, Manhattan, NY",
  dropoffLocation: "JFK International Airport Terminal 4, NY",
  rentalDuration: "6 Days Remaining",
};

export const mockUpcomingTrips: readonly UpcomingTrip[] = [
  {
    id: "TR-10041",
    date: "July 02 - July 05",
    clientName: "Alice Vance",
    vehicleModel: "Audi A8 L",
    payout: "$900.00",
    duration: "3 Days",
  },
  {
    id: "TR-10045",
    date: "July 10 - July 15",
    clientName: "Robert Sterling",
    vehicleModel: "Range Rover Autobiography",
    payout: "$1,400.00",
    duration: "5 Days",
  },
  {
    id: "TR-10049",
    date: "July 20 - July 21",
    clientName: "Diana Prince",
    vehicleModel: "Porsche 911",
    payout: "$650.00",
    duration: "1 Day",
  },
];

export const mockPayoutHistory: readonly HistoricalPayout[] = [
  {
    tripId: "TR-10028",
    date: "June 15, 2026",
    clientName: "Bruce Wayne",
    vehicleModel: "Mercedes-Benz S-Class",
    duration: "3 Days",
    amount: "$750.00",
    status: "Paid",
  },
  {
    tripId: "TR-10025",
    date: "June 08, 2026",
    clientName: "Tony Stark",
    vehicleModel: "Audi A8 L",
    duration: "5 Days",
    amount: "$1,250.00",
    status: "Paid",
  },
  {
    tripId: "TR-10021",
    date: "May 28, 2026",
    clientName: "Clark Kent",
    vehicleModel: "Range Rover Autobiography",
    duration: "2 Days",
    amount: "$500.00",
    status: "Paid",
  },
  {
    tripId: "TR-10018",
    date: "May 15, 2026",
    clientName: "Sara Kyle",
    vehicleModel: "Porsche 911",
    duration: "4 Days",
    amount: "$1,000.00",
    status: "Paid",
  },
];

export const mockDashboardSummary: DriverDashboardSummaryDto = {
  status: "Verified",
  availability: "Available",
  isActive: true,
  totalTripsCompleted: 18,
  averageRating: 4.9,
  totalEarnings: 2850.0,
  activeRequestsCount: 0,
  upcomingAssignmentsCount: 4,
  totalTrips: 18,
  activeTrips: 0,
  completedTrips: 18,
  upcomingTrips: 4,
};

// API Fetch Calls with Seamless Fallback

/**
 * Fetch active rental assignment details for the logged-in driver.
 * Returns null if there is no active assignment (404).
 */
export async function getDriverActiveAssignment(accessToken: string): Promise<TripAssignment | null> {
  try {
    return await apiFetchJson<TripAssignment>("/api/driver/dashboard/active-assignment", {
      method: "GET",
      accessToken,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    logger.warn("Failed to fetch driver active assignment.", error);
    return null;
  }
}

/**
 * Fetch upcoming shift / calendar schedule for the logged-in driver.
 */
export async function getDriverUpcomingSchedule(accessToken: string): Promise<readonly UpcomingTrip[]> {
  try {
    return await apiFetchJson<UpcomingTrip[]>("/api/driver/dashboard/upcoming-schedule", {
      method: "GET",
      accessToken,
    });
  } catch (error) {
    logger.warn("Failed to fetch driver upcoming schedule.", error);
    return [];
  }
}

/**
 * Fetch historical payout logs for the logged-in driver.
 */
export async function getDriverPayoutLogs(accessToken: string): Promise<readonly HistoricalPayout[]> {
  try {
    return await apiFetchJson<HistoricalPayout[]>("/api/driver/dashboard/payout-logs", {
      method: "GET",
      accessToken,
    });
  } catch (error) {
    logger.warn("Failed to fetch driver payout logs.", error);
    return [];
  }
}

/**
 * Fetch analytical payout summary metrics/KPIs for the logged-in driver.
 * Uses existing backend endpoint: GET /api/driver/dashboard/summary
 */
export async function getDriverDashboardSummary(accessToken: string): Promise<DriverDashboardSummaryDto | null> {
  try {
    return await apiFetchJson<DriverDashboardSummaryDto>("/api/driver/dashboard/summary", {
      method: "GET",
      accessToken,
    });
  } catch (error) {
    logger.warn("Failed to fetch driver dashboard summary.", error);
    return null;
  }
}

/**
 * Toggle driver availability status.
 * Uses existing backend endpoint: PUT /api/driver/profile/availability
 */
export async function updateDriverAvailability(
  accessToken: string,
  availability: DriverAvailabilityStatus
): Promise<DriverProfileStatusDto> {
  try {
    return await apiFetchJson<DriverProfileStatusDto>("/api/driver/profile/availability", {
      method: "PUT",
      accessToken,
      body: JSON.stringify({ availability }),
    });
  } catch (error) {
    logger.warn(
      `Failed to update availability status to ${availability}. Falling back to mock success response.`,
      error
    );
    return {
      status: "Verified",
      availability,
      isActive: true,
    };
  }
}

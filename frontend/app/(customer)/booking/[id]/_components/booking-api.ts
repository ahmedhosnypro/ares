import { toApiUrl } from "@/utils/api-client";
import { type BookingDetails } from "./types";

interface FetchBookingDetailsResult {
  readonly booking: BookingDetails | null;
  readonly status: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function getString(record: Record<string, unknown> | null, keys: readonly string[]): string | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return undefined;
}

function getNumber(record: Record<string, unknown> | null, keys: readonly string[]): number | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function getBoolean(record: Record<string, unknown> | null, keys: readonly string[]): boolean | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

function getObject(record: Record<string, unknown> | null, keys: readonly string[]): Record<string, unknown> | null {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = asRecord(record[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function pickBookingNode(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }

  return asRecord(root.resultData) ?? asRecord(root.data) ?? root;
}

function parseBookingDetails(payload: unknown): BookingDetails | null {
  const bookingNode = pickBookingNode(payload);
  if (!bookingNode) {
    return null;
  }

  const carNode = getObject(bookingNode, ["car", "Car"]);
  const supplierNode = getObject(carNode, ["supplier", "Supplier"]) ?? getObject(bookingNode, ["supplier", "Supplier"]);
  const driverNode = getObject(bookingNode, ["driver", "Driver"]);
  const pickupNode = getObject(bookingNode, ["pickupLocation", "PickupLocation"]);
  const dropOffNode = getObject(bookingNode, ["dropOffLocation", "DropOffLocation"]);

  return {
    id: getString(bookingNode, ["id", "_id", "Id"]),
    car: carNode
      ? {
          id: getString(carNode, ["id", "_id", "Id"]),
          name: getString(carNode, ["name", "Name"]),
          image: getString(carNode, ["image", "Image"]),
          supplier: supplierNode
            ? {
                id: getString(supplierNode, ["id", "_id", "Id"]),
                fullName: getString(supplierNode, ["fullName", "FullName"]),
                email: getString(supplierNode, ["email", "Email"]),
              }
            : undefined,
        }
      : undefined,
    driver: driverNode
      ? {
          id: getString(driverNode, ["id", "_id", "Id"]),
          fullName: getString(driverNode, ["fullName", "FullName"]),
          email: getString(driverNode, ["email", "Email"]),
        }
      : undefined,
    pickupLocation: pickupNode
      ? {
          id: getString(pickupNode, ["id", "_id", "Id"]),
          name: getString(pickupNode, ["name", "Name"]),
        }
      : undefined,
    dropOffLocation: dropOffNode
      ? {
          id: getString(dropOffNode, ["id", "_id", "Id"]),
          name: getString(dropOffNode, ["name", "Name"]),
        }
      : undefined,
    from: getString(bookingNode, ["from", "From"]),
    to: getString(bookingNode, ["to", "To"]),
    price: getNumber(bookingNode, ["price", "Price"]),
    status: getString(bookingNode, ["status", "Status"]),
    payLater: getBoolean(bookingNode, ["payLater", "PayLater"]),
  };
}

export async function fetchBookingDetails(bookingId: string, accessToken: string): Promise<FetchBookingDetailsResult> {
  const response = await fetch(toApiUrl(`/api/booking/${bookingId}/en`), {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return {
      booking: null,
      status: response.status,
    };
  }

  const payload: unknown = await response.json();
  const booking = parseBookingDetails(payload);

  if (!booking) {
    return {
      booking: null,
      status: 502,
    };
  }

  return {
    booking,
    status: response.status,
  };
}

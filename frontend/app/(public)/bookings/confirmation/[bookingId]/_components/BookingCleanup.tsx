"use client";

import { useEffect } from "react";
import { logger } from "@/utils/logger";

/**
 * Client-side component that clears checkout/cart data from sessionStorage
 * after a successful booking confirmation.
 */
export default function BookingCleanup() {
  useEffect(() => {
    try {
      // Clear checkout-related keys from sessionStorage and localStorage
      const keys = ["bookingIntent", "checkoutBookingId"];

      for (const key of keys) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      }

      logger.info("Booking cleanup: Checkout data cleared from storage.");
    } catch (error) {
      logger.error("Booking cleanup: Failed to clear storage:", error);
    }
  }, []);

  return null;
}

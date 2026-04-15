"use client";

import { createContext } from "react";

export interface BookingContextType {
  pickupDate: string | null;
  returnDate: string | null;
  totalPrice: number | null;
  setDates: (pickup: string, returnDt: string) => void;
  setPrice: (price: number) => void;
}

export const VehicleBookingContext = createContext<BookingContextType | undefined>(undefined);

"use client";

import { useContext } from "react";
import { VehicleBookingContext } from "./VehicleBookingContext";

export const useBooking = () => {
  const context = useContext(VehicleBookingContext);
  if (!context) throw new Error("useBooking must be used within VehicleBookingProvider");
  return context;
};

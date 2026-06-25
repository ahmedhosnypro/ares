import { Metadata } from "next";
import DriverTripsClient from "./DriverTripsClient";

export const metadata: Metadata = {
  title: "My Trips | ARES Driver",
  description: "View and manage your assigned trips.",
};

export default function DriverTripsPage() {
  return <DriverTripsClient />;
}

import { Metadata } from "next";
import DriverEarningsClient from "./DriverEarningsClient";

export const metadata: Metadata = {
  title: "My Earnings | ARES Driver",
  description: "View your driving earnings and history.",
};

export default function DriverEarningsPage() {
  return <DriverEarningsClient />;
}

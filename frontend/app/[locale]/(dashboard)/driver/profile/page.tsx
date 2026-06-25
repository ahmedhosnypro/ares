import { Metadata } from "next";
import DriverProfileClient from "./DriverProfileClient";

export const metadata: Metadata = {
  title: "My Profile | ARES Driver",
  description: "View and manage your driver profile.",
};

export default function DriverProfilePage() {
  return <DriverProfileClient />;
}

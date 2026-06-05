import { Metadata } from "next";
import DriverRequestsClient from "./DriverRequestsClient";

export const metadata: Metadata = {
  title: "Available Requests | ARES Driver",
  description: "View and accept available ride requests in your area.",
};

export default function DriverRequestsPage() {
  return <DriverRequestsClient />;
}

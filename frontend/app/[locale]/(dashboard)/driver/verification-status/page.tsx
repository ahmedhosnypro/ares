import { Metadata } from "next";
import VerificationStatusClient from "./VerificationStatusClient";

export const metadata: Metadata = {
  title: "Verification Status | ARES Driver",
  description: "Check the status of your driver profile verification.",
};

export default function VerificationStatusPage() {
  return <VerificationStatusClient />;
}

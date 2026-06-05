import { Metadata } from "next";
import CompleteProfileClient from "./CompleteProfileClient";

export const metadata: Metadata = {
  title: "Complete Driver Profile | ARES",
  description: "Provide your license, ID, and work area details to start driving with ARES.",
};

export default function CompleteProfilePage() {
  return <CompleteProfileClient />;
}

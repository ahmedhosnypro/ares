import { Metadata } from "next";
import CompleteProfileClient from "./CompleteProfileClient";

/**
 * Profile-completion landing page.
 *
 * Reached automatically after a freshly-registered user signs in while
 * their `ApplicationUser.Status` is `"Pending"`. The page lets them
 * confirm their name and phone, then POSTs to
 * `/api/auth/complete-profile`, which flips the server-side Status to
 * `"Active"`. From there the user is redirected to their role-specific
 * landing surface (Customer → home, Supplier → dashboard).
 */
export const metadata: Metadata = {
  title: "Complete your profile | ARES",
  description: "Confirm your details to finish setting up your ARES account.",
};

export default function CompleteProfilePage() {
  return <CompleteProfileClient />;
}

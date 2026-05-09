import { redirect } from "next/navigation";

/**
 * Supplier portal index — always redirect to the dashboard.
 *
 * Keeps `/supplier` as a meaningful entry point even though all real content
 * lives at `/supplier/dashboard` and below.
 */
export default function SupplierIndexPage() {
  redirect("/supplier/dashboard");
}

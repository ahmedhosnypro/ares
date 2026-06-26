import { redirect } from "@/shared/i18n/routing";
import { getLocale } from "next-intl/server";

/**
 * Supplier portal index — always redirect to the dashboard.
 *
 * Keeps `/supplier` as a meaningful entry point even though all real content
 * lives at `/supplier/dashboard` and below.
 */
export default async function SupplierIndexPage() {
  const locale = await getLocale();
  redirect({ href: "/supplier/dashboard", locale });
}

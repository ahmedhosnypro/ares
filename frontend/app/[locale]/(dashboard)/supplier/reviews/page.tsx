import { Metadata } from "next";
import SupplierReviewsClient from "./SupplierReviewsClient";

/**
 * Supplier Reviews page (`/supplier/reviews`).
 *
 * Backend endpoints consumed by `SupplierReviewsClient`
 * (all gated to the `Supplier` role, supplier-id resolved from JWT):
 *
 *   - GET    /api/supplier/reviews               → paginated list + filters
 *   - GET    /api/supplier/reviews/statistics    → aggregate stats
 *   - PUT    /api/supplier/reviews/{id}/reply    → create / edit reply
 *   - POST   /api/supplier/reviews/{id}/report   → flag inappropriate
 *
 * Suppliers can VIEW reviews, REPLY and EDIT their reply, and REPORT
 * reviews — they cannot delete or modify customer-authored content
 * (those endpoints are simply not exposed on the supplier controller).
 */

export const metadata: Metadata = {
  title: "Reviews | ARES Supplier",
  description: "Reply to customer reviews, monitor your rating, and report inappropriate content.",
};

export default function SupplierReviewsPage() {
  return <SupplierReviewsClient />;
}

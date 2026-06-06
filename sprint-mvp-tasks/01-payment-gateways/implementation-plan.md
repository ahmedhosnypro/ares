# Payment Gateways & Security Implementation Plan

## Associated Documentation
Please refer to the detailed specification documents copied in this directory for exact requirements:
- [Backend Specs](./backend)
- [Frontend Specs](./frontend)
- [Database Specs](./database)

## Current State (Gap Analysis)
The system currently uses a mocked `PaymentService.cs` that simulates payment logic. It completely lacks actual third-party integrations (Stripe/PayPal), PCI-compliant tokenization, support for mobile wallets, two-phase auth/capture flows, dispute handling, and automated refund API processing. The frontend has some UI for showing payment statuses but lacks actual secure drop-ins for processing.

## Implementation Steps

### Backend Tasks (.NET 8)
1. **Stripe & PayPal SDK Integration:** Install `Stripe.net` and PayPal server SDKs in `backend/Infrastructure`. Swap the mocked logic in `PaymentService.cs` to execute real API calls.
2. **Webhook Controllers:** Create secure endpoints (e.g., `POST /api/webhooks/stripe`) to listen for events like `payment_intent.succeeded` or `charge.dispute.created`. Verify signatures.
3. **Two-Phase Payments (Auth/Capture):** Update booking creation to only *authorize* the card initially. Implement background jobs or logic in `BookingService.cs` to capture funds when the booking is confirmed/started.
4. **Refund Processing:** Wire up the existing `RefundProcessedAt` and `RefundStatus` fields in `BookingService.cs` so cancelling a booking triggers real refund API calls to Stripe/PayPal based on cancellation policies.
5. **Database Models:** Verify/Update EF Core models (`BookingPayment`, `TransactionLogs`, `Disputes`) to track Stripe intent IDs, webhook events, and dispute status.

### Frontend Tasks (Next.js)
1. **PCI-Compliant Checkout:** Integrate **Stripe Elements** (React) and the **PayPal JS SDK** on the booking checkout page. Remove any custom forms handling raw credit card data.
2. **Mobile Wallets:** Enable Apple Pay/Google Pay dynamically via the Stripe/PayPal element configurations.
3. **Admin Dashboard Updates:** Add UI components in the Admin panel to view transaction logs, monitor dispute statuses, and manually initiate partial/full refunds securely.

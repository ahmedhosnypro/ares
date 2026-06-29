# Checkout Session Page Translation - `[sessionId]`

## Route

`/(public)/checkout-session/[sessionId]`

## Files

| File       | Status |
| ---------- | ------ |
| `page.tsx` | Done   |

## Hardcoded Strings Extracted

| Key                 | English                                                | Arabic                                      |
| ------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `paymentSuccessful` | Payment Successful                                     | الدفع ناجح                                  |
| `paymentFailed`     | Payment Failed                                         | فشل الدفع                                   |
| `successMessage`    | Your payment was processed successfully.               | تمت معالجة الدفع بنجاح.                     |
| `failureMessage`    | Your payment could not be processed. Please try again. | تعذرت معالجة الدفع. يرجى المحاولة مرة أخرى. |
| `tryAgain`          | Try Again                                              | حاول مرة أخرى                               |
| `myBookings`        | My Bookings                                            | حجوزاتي                                     |

## Translation Files

- Type: `shared/messages/types/public/checkout-session.ts`
- EN: `shared/messages/en/public/checkout-session.ts`
- AR: `shared/messages/ar/public/checkout-session.ts`

## Integration

- Added `CheckoutSessionLabels` to `message.ts` exports and `PublicPagesSchema`
- Added `checkoutSession` to `en.ts` and `ar.ts` root imports/objects

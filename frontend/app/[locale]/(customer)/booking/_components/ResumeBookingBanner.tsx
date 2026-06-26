"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { Alert, AlertTitle, Box, Button, Stack } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import {
  cancelCheckout,
  checkoutStepHref,
  getActiveCheckout,
  type CheckoutState,
} from "@/api-clients/checkout/checkout";
import { logger } from "@/utils/logger";

/**
 * Detects an unfinished checkout for the signed-in customer and offers to
 * resume it — the booking-recovery surface required so a refresh, lost
 * connection or error never strands the user. Renders nothing when there is no
 * resumable booking.
 *
 * `excludeBookingId` lets a page that is already showing a given booking avoid
 * advertising a banner for that same booking.
 */
export function ResumeBookingBanner({ excludeBookingId }: { excludeBookingId?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [active, setActive] = useState<CheckoutState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const state = await getActiveCheckout(session.accessToken);
        if (!cancelled) setActive(state);
      } catch (e) {
        logger.error("Failed to check for a resumable booking", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session]);

  const handleDiscard = useCallback(async () => {
    if (!active || !session?.accessToken) return;
    setBusy(true);
    try {
      await cancelCheckout(active.bookingId, session.accessToken);
      setActive(null);
    } catch (e) {
      logger.error("Failed to discard the unfinished booking", e);
    } finally {
      setBusy(false);
    }
  }, [active, session]);

  if (!active || dismissed || active.bookingId === excludeBookingId) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Alert
        severity="info"
        icon={<RestoreIcon />}
        onClose={() => {
          setDismissed(true);
        }}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button color="inherit" size="small" disabled={busy} onClick={() => void handleDiscard()}>
              Discard
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={busy}
              onClick={() => {
                router.push(checkoutStepHref(active));
              }}
            >
              Continue
            </Button>
          </Stack>
        }
      >
        <AlertTitle>You have an unfinished booking</AlertTitle>
        Continue where you left off with {active.vehicleLabel}
        {active.status === "PaymentPending" ? " — your vehicle is being held." : "."}
      </Alert>
    </Box>
  );
}

export default ResumeBookingBanner;

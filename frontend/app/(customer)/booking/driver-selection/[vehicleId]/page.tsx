"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { toApiUrl } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { formatCurrency } from "@/utils/currency-helpers";
import { logger } from "@/utils/logger";
import {
  CheckoutError,
  checkoutStepHref,
  createDraft,
  getActiveCheckout,
  selectDriver,
  type CheckoutState,
} from "@/api-clients/checkout/checkout";

interface BookingIntent {
  vehicleId: string;
  pickupLocationId: string;
  dropOffLocationId: string;
  pickupDate: string;
  returnDate: string;
  totalPrice: number;
  vehicleLabel: string;
  pricePerDay: number;
  needDriver?: boolean;
  driverProfileId?: string | null;
  driverName?: string | null;
  driverFee?: number;
}

interface AvailableDriver {
  driverProfileId: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  averageRating: number;
  totalTrips: number;
  experienceYears: number;
  driverFee: number;
}

interface Eligibility {
  hasApprovedLicense: boolean;
  identityVerified: boolean;
  driverRequired: boolean;
}

type DriveMode = "self" | "driver";

function parseIntent(raw: string | null): BookingIntent | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingIntent;
  } catch {
    return null;
  }
}

/** Rebuilds the client-side intent from a server-restored checkout state. */
function intentFromState(s: CheckoutState): BookingIntent {
  const days = s.totalDays > 0 ? s.totalDays : 1;
  return {
    vehicleId: s.vehicleId,
    pickupLocationId: "",
    dropOffLocationId: "",
    pickupDate: s.pickupDate,
    returnDate: s.returnDate,
    totalPrice: s.vehicleFee,
    vehicleLabel: s.vehicleLabel,
    pricePerDay: s.vehicleFee / days,
    needDriver: s.requiresDriver,
    driverProfileId: s.driverProfileId ?? null,
    driverName: s.driverName ?? null,
    driverFee: s.driverFee ?? 0,
  };
}

export default function DriverSelectionPage() {
  const params = useParams<{ vehicleId: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [intent, setIntent] = useState<BookingIntent | null>(() => {
    if (typeof window === "undefined") return null;
    const parsed = parseIntent(sessionStorage.getItem("bookingIntent"));
    return parsed?.vehicleId === params.vehicleId ? parsed : null;
  });

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(true);
  const [mode, setMode] = useState<DriveMode | null>(null);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [noBooking, setNoBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const draftRequested = useRef(false);

  // Booking recovery: if the client intent was lost (refresh, new tab, error),
  // restore it from the database instead of silently redirecting away.
  useEffect(() => {
    if (status === "loading" || intent) return;
    if (status !== "authenticated" || !session?.accessToken) return;
    let cancelled = false;
    setRecovering(true);
    void (async () => {
      try {
        const state = await getActiveCheckout(session.accessToken);
        if (cancelled) return;
        if (state && state.vehicleId === params.vehicleId) {
          setIntent(intentFromState(state));
          setBookingId(state.bookingId);
          sessionStorage.setItem("checkoutBookingId", state.bookingId);
        } else if (state) {
          // An unfinished booking exists for a different vehicle → take the
          // customer to the right step rather than dropping them home.
          router.replace(checkoutStepHref(state));
        } else {
          setNoBooking(true);
        }
      } catch (e) {
        logger.error("Booking recovery failed", e);
        setNoBooking(true);
      } finally {
        if (!cancelled) setRecovering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [intent, status, session, params.vehicleId, router]);

  // Persist a DRAFT booking server-side as soon as the funnel starts, so it can
  // always be recovered. DRAFT does not reserve the vehicle.
  useEffect(() => {
    if (status !== "authenticated" || !intent || bookingId || !session?.accessToken) return;
    let cancelled = false;
    void (async () => {
      try {
        if (draftRequested.current) return;
        draftRequested.current = true;

        const state = await createDraft(
          {
            vehicleId: intent.vehicleId,
            pickupDate: intent.pickupDate,
            returnDate: intent.returnDate,
            pickupLocationId: intent.pickupLocationId || undefined,
            dropOffLocationId: intent.dropOffLocationId || undefined,
          },
          session.accessToken
        );
        if (cancelled) return;
        setBookingId(state.bookingId);
        sessionStorage.setItem("checkoutBookingId", state.bookingId);
      } catch (e) {
        logger.error("Failed to start the draft booking", e);
      }
    })();
    return () => {
      cancelled = true;
      draftRequested.current = false;
    };
  }, [status, intent, bookingId, session]);

  // Auth gate.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/sign-in?callbackUrl=/booking/driver-selection/${params.vehicleId}`);
    }
  }, [status, router, params.vehicleId]);

  // Load drive eligibility (license status).
  useEffect(() => {
    if (status !== "authenticated" || !intent) return;
    const token = session.accessToken;
    const load = async () => {
      setLoadingEligibility(true);
      try {
        const res = await fetch(toApiUrl("/api/checkout/eligibility"), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as Eligibility;
          setEligibility(data);
          // No license → driver is mandatory: pre-select the driver path.
          if (data.driverRequired) setMode("driver");
        }
      } catch (e) {
        logger.error("Failed to load drive eligibility", e);
      } finally {
        setLoadingEligibility(false);
      }
    };
    void load();
  }, [status, session, intent]);

  // When the driver path is chosen, load the catalog of available drivers.
  useEffect(() => {
    if (mode !== "driver" || !intent || status !== "authenticated") return;
    const token = session.accessToken;
    const load = async () => {
      setLoadingDrivers(true);
      setError("");
      try {
        const url = toApiUrl(
          `/api/checkout/drivers?pickupDate=${encodeURIComponent(intent.pickupDate)}&returnDate=${encodeURIComponent(
            intent.returnDate
          )}`
        );
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load drivers");
        setDrivers((await res.json()) as AvailableDriver[]);
      } catch (e) {
        logger.error("Failed to load available drivers", e);
        setError("We couldn't load drivers right now. Please try again.");
      } finally {
        setLoadingDrivers(false);
      }
    };
    void load();
  }, [mode, intent, status, session]);

  const selfDriveDisabled = eligibility?.driverRequired ?? false;

  const canContinue = useMemo(() => {
    if (!bookingId) return false;
    if (mode === "self") return !selfDriveDisabled;
    if (mode === "driver") return Boolean(selectedDriverId);
    return false;
  }, [mode, selfDriveDisabled, selectedDriverId, bookingId]);

  const handleContinue = async () => {
    if (!intent || !canContinue || submitting) return;
    const needDriver = mode === "driver";
    const selected = drivers.find(d => d.driverProfileId === selectedDriverId);
    const updated: BookingIntent = {
      ...intent,
      needDriver,
      driverProfileId: needDriver ? selectedDriverId : null,
      driverName: needDriver && selected ? `${selected.firstName ?? ""} ${selected.lastName ?? ""}`.trim() : null,
      driverFee: needDriver && selected ? selected.driverFee : 0,
    };

    setSubmitting(true);
    setError("");
    try {
      // Persist the driver choice (DRIVER_SELECTED) so the server knows the
      // chosen driver before payment. Still does not reserve the vehicle.
      if (bookingId && session?.accessToken) {
        await selectDriver(
          bookingId,
          { needDriver, driverProfileId: needDriver ? selectedDriverId : null },
          session.accessToken
        );
      }
      sessionStorage.setItem("bookingIntent", JSON.stringify(updated));
      router.push(`/booking/payment/${bookingId}`);
    } catch (e) {
      logger.error("Failed to save driver selection", e);
      setError(e instanceof CheckoutError ? e.message : "We couldn't save your driver choice. Please try again.");
      setSubmitting(false);
    }
  };

  if (status === "loading" || recovering) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Intent lost and nothing to recover → show a clear path forward instead of a
  // silent redirect.
  if (!intent) {
    return (
      <Box component="main" sx={{ minHeight: "70vh", display: "grid", placeItems: "center", px: 2 }}>
        <Alert
          severity="warning"
          sx={{ maxWidth: 520 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                router.push(`/vehicles/${params.vehicleId}`);
              }}
            >
              Choose dates
            </Button>
          }
        >
          {noBooking
            ? "We couldn't find an in-progress booking. Please start again from the vehicle page."
            : "Loading your booking…"}
        </Alert>
      </Box>
    );
  }

  if (loadingEligibility) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Choose how you&apos;ll drive
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Step 3 of 4 · {intent.vehicleLabel}
        </Typography>

        {/* Stepper */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 4, maxWidth: 480 }}>
          <Box sx={{ height: 8, flexGrow: 1, bgcolor: "primary.main", borderRadius: 999 }} />
          <Box sx={{ height: 8, flexGrow: 1, bgcolor: "primary.main", borderRadius: 999 }} />
          <Box sx={{ height: 8, flexGrow: 1, bgcolor: "secondary.main", borderRadius: 999 }} />
          <Box sx={{ height: 8, flexGrow: 1, bgcolor: "action.disabledBackground", borderRadius: 999 }} />
        </Stack>

        {selfDriveDisabled && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You don&apos;t have an approved driving license on file, so a driver is required for this booking. You can
            add a license from your profile to unlock self-drive.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Mode choice */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: mode === "self" ? "primary.main" : "divider",
                borderWidth: mode === "self" ? 2 : 1,
                opacity: selfDriveDisabled ? 0.55 : 1,
                height: "100%",
              }}
            >
              <CardActionArea
                disabled={selfDriveDisabled}
                onClick={() => {
                  setMode("self");
                  setSelectedDriverId(null);
                }}
                sx={{ height: "100%", p: 1 }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
                    <DirectionsCarIcon color={mode === "self" ? "primary" : "action"} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Self Drive
                    </Typography>
                    {mode === "self" && <CheckCircleIcon color="primary" sx={{ ml: "auto" }} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Drive the vehicle yourself. Requires a verified driving license.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: mode === "driver" ? "primary.main" : "divider",
                borderWidth: mode === "driver" ? 2 : 1,
                height: "100%",
              }}
            >
              <CardActionArea
                onClick={() => {
                  setMode("driver");
                }}
                sx={{ height: "100%", p: 1 }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
                    <PersonSearchIcon color={mode === "driver" ? "primary" : "action"} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Request a Driver
                    </Typography>
                    {mode === "driver" && <CheckCircleIcon color="primary" sx={{ ml: "auto" }} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Pick a verified driver to drive for you. A driver fee applies.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>

        {/* Driver catalog */}
        {mode === "driver" && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Available drivers
            </Typography>

            {loadingDrivers ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : drivers.length === 0 ? (
              <Alert severity="warning">
                No verified drivers are available for these dates right now. Please try different dates or check back
                later.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {drivers.map(driver => {
                  const selected = selectedDriverId === driver.driverProfileId;
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={driver.driverProfileId}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderColor: selected ? "primary.main" : "divider",
                          borderWidth: selected ? 2 : 1,
                          height: "100%",
                        }}
                      >
                        <CardActionArea
                          onClick={() => {
                            setSelectedDriverId(driver.driverProfileId);
                          }}
                          sx={{ height: "100%" }}
                        >
                          <CardContent>
                            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
                              <Avatar
                                src={driver.profilePictureUrl ? toImageUrl(driver.profilePictureUrl) : undefined}
                                sx={{ width: 56, height: 56 }}
                              >
                                {!driver.profilePictureUrl && (driver.firstName?.[0] ?? "D")}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                                  {driver.firstName} {driver.lastName}
                                </Typography>
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                  <Rating value={driver.averageRating} readOnly size="small" precision={0.5} />
                                  <Typography variant="caption" color="text.secondary">
                                    ({driver.totalTrips})
                                  </Typography>
                                </Stack>
                              </Box>
                              {selected && <CheckCircleIcon color="primary" sx={{ ml: "auto" }} />}
                            </Stack>

                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                              <Typography variant="body2" color="text.secondary">
                                Experience
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {driver.experienceYears > 0 ? `${driver.experienceYears} yr` : "New"} ·{" "}
                                {driver.totalTrips} trips
                              </Typography>
                            </Stack>
                            <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Driver fee
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800 }} color="primary.main">
                                {formatCurrency(driver.driverFee)}
                              </Typography>
                            </Stack>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* Continue */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
          <Button
            variant="text"
            onClick={() => {
              router.push(`/vehicles/${intent.vehicleId}`);
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            size="large"
            endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
            disabled={!canContinue || submitting}
            onClick={() => void handleContinue()}
            sx={{ borderRadius: 999, px: 4, fontWeight: 800, textTransform: "none" }}
          >
            Continue to payment
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

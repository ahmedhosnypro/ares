"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, IconButton, Tooltip } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

interface BookingIntent {
  vehicleId: string;
}

function readIntent(): BookingIntent | null {
  try {
    const raw = sessionStorage.getItem("bookingIntent");
    if (!raw) return null;
    return JSON.parse(raw) as BookingIntent;
  } catch {
    return null;
  }
}

export default function CheckoutIndicator() {
  // sessionStorage is browser-only. Reading it during render makes the server
  // (no sessionStorage → null → renders nothing) disagree with the client
  // (intent present → renders an <a> IconButton), which throws a hydration
  // mismatch. Start as null so the first client render matches the server,
  // then read sessionStorage after mount (post-hydration) and re-render.
  const [intent, setIntent] = useState<BookingIntent | null>(null);

  useEffect(() => {
    setIntent(readIntent());
  }, []);

  if (!intent) return null;

  return (
    <Tooltip title="Complete your booking" arrow>
      <IconButton
        component={Link}
        href={`/checkout/${intent.vehicleId}`}
        aria-label="Complete your booking"
        sx={{
          color: "common.white",
          transition: "transform 0.2s ease",
          "&:hover": { transform: "scale(1.1)" },
        }}
      >
        <Badge badgeContent={1} color="error">
          <ShoppingCartIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

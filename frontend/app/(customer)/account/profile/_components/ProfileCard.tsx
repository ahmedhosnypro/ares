"use client";

import { Card } from "@mui/material";
import type { ReactNode } from "react";

interface ProfileCardProps {
  readonly children: ReactNode;
}

/**
 * Themed card wrapper used by the server-rendered profile page.
 * Lives in a client component so MUI sx theme callbacks stay
 * on the client side and are never serialized across the boundary.
 */
export default function ProfileCard({ children }: ProfileCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: t => t.palette.shadow.card,
        border: t => `1px solid ${t.palette.border.main}`,
        transition: "box-shadow 0.3s ease",
        "&:hover": {
          boxShadow: t => t.palette.shadow.cardHover,
        },
      }}
    >
      {children}
    </Card>
  );
}

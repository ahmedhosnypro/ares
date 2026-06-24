"use client";

import { Card, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

interface ProfileCardProps {
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
}

/**
 * Themed card wrapper used by the server-rendered profile page.
 * Lives in a client component so MUI sx theme callbacks stay
 * on the client side and are never serialized across the boundary.
 */
export default function ProfileCard({ children, sx }: ProfileCardProps) {
  return (
    <Card
      sx={[
        {
          borderRadius: 2,
          boxShadow: t => t.palette.shadow.card,
          border: t => `1px solid ${t.palette.border.main}`,
          transition: "box-shadow 0.3s ease",
          "&:hover": {
            boxShadow: t => t.palette.shadow.cardHover,
          },
        },
        ...((Array.isArray(sx) ? sx : sx ? [sx] : []) as readonly (object | ((t: Theme) => object))[]),
      ]}
    >
      {children}
    </Card>
  );
}

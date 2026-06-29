"use client";

import { SvgIcon, type SvgIconProps } from "@mui/material";

export default function SteeringWheelIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.84.62-3.53 1.68-4.88l3.96 2.29c-.4.78-.64 1.66-.64 2.59 0 2.21 1.79 4 4 4s4-1.79 4-4c0-.93-.24-1.81-.64-2.59l3.96-2.29C19.38 8.47 20 10.16 20 12c0 4.41-3.59 8-8 8zm0-10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6.2-4.12C7.3 4.7 9.53 4 12 4s4.7.7 5.8 1.88l-3.96 2.29C13.25 7.82 12.65 7.7 12 7.7c-.65 0-1.25.12-1.84.47L5.8 5.88z" />
    </SvgIcon>
  );
}

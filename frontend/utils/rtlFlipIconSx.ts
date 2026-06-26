import type { SxProps, Theme } from "@mui/material/styles";

export const rtlFlipIconSx: SxProps<Theme> = theme => ({
  transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
});

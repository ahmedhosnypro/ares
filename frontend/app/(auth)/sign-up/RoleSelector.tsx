"use client";

import { Box, Stack, Typography, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import type { SignUpRole } from "@/lib/validation/schemas";

interface RoleSelectorProps {
  readonly value: SignUpRole;
  readonly onChange: (next: SignUpRole) => void;
  readonly disabled?: boolean;
}

interface RoleOption {
  readonly value: SignUpRole;
  readonly title: string;
  readonly description: string;
  readonly icon: typeof PersonRoundedIcon;
}

const OPTIONS: readonly RoleOption[] = [
  {
    value: "customer",
    title: "Customer",
    description: "Rent vehicles for personal or business trips.",
    icon: PersonRoundedIcon,
  },
  {
    value: "supplier",
    title: "Supplier",
    description: "List and manage your fleet of rental vehicles.",
    icon: StorefrontRoundedIcon,
  },
];

/**
 * Role selector rendered at the top of the registration form.
 *
 * Visual contract (per spec):
 *   - selectable cards (not a dropdown)
 *   - Customer pre-selected by default
 *   - the selected card has a highlighted border, background tint,
 *     subtle glow/shadow, and a check icon in the top-right corner
 *
 * Implementation notes:
 *   - colours come from MUI's primary palette via `alpha(...)` so the
 *     control stays in sync with the existing form theme and obeys the
 *     no-hard-coded-colour rule in AGENTS.md;
 *   - the two cards live in a responsive 2-column grid (1 column on
 *     very narrow viewports) so the control stays comfortable on mobile;
 *   - keyboard support is implicit because each card is a real
 *     `<button>` — focus ring + Space/Enter handling come for free.
 */
export default function RoleSelector({ value, onChange, disabled = false }: RoleSelectorProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        component="legend"
        variant="caption"
        sx={{
          display: "block",
          mb: 1,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "text.secondary",
        }}
      >
        I want to register as
      </Typography>
      <Box
        role="radiogroup"
        aria-label="Account type"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {OPTIONS.map(option => {
          const selected = option.value === value;
          const Icon = option.icon;
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => {
                onChange(option.value);
              }}
              sx={{
                position: "relative",
                cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left",
                p: 2.25,
                borderRadius: 3,
                border: "2px solid",
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : "background.paper",
                color: "text.primary",
                font: "inherit",
                outline: "none",
                transition: theme.transitions.create(["border-color", "background-color", "box-shadow", "transform"], {
                  duration: theme.transitions.duration.shorter,
                }),
                boxShadow: selected ? `0 8px 20px -10px ${alpha(theme.palette.primary.main, 0.55)}` : "none",
                opacity: disabled ? 0.6 : 1,
                "&:hover": disabled
                  ? undefined
                  : {
                      borderColor: selected ? "primary.main" : alpha(theme.palette.primary.main, 0.4),
                      transform: "translateY(-1px)",
                    },
                "&:focus-visible": {
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`,
                },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: selected
                      ? alpha(theme.palette.primary.main, 0.16)
                      : alpha(theme.palette.text.primary, 0.06),
                    color: selected ? "primary.main" : "text.secondary",
                    flexShrink: 0,
                    transition: theme.transitions.create(["background-color", "color"], {
                      duration: theme.transitions.duration.shorter,
                    }),
                  }}
                >
                  <Icon fontSize="medium" />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {option.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    {option.description}
                  </Typography>
                </Box>
              </Stack>

              {selected && (
                <CheckCircleRoundedIcon
                  fontSize="small"
                  color="primary"
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                  }}
                  aria-hidden
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

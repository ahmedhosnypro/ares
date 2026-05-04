import {
  responsiveFontSizes,
  createTheme,
  type PaletteMode,
  type PaletteOptions,
  type SimplePaletteColorOptions,
} from "@mui/material/styles";
import { materialTheme } from "./material-theme";

type M3Scheme = typeof materialTheme.schemes.light | typeof materialTheme.schemes.dark;

// Extend the Palette interface to include custom colors and M3 tokens
declare module "@mui/material/styles" {
  interface Palette {
    overlay: {
      dark: string;
      gradient: string;
      tealGradient: string;
      blur: string;
    };
    border: {
      light: string;
      main: string;
    };
    shadow: {
      card: string;
      cardHover: string;
      button: string;
      buttonHover: string;
    };
    m3: M3Scheme;
  }
  interface PaletteOptions {
    overlay?: {
      dark?: string;
      gradient?: string;
      tealGradient?: string;
      blur?: string;
    };
    border?: {
      light?: string;
      main?: string;
    };
    shadow?: {
      card?: string;
      cardHover?: string;
      button?: string;
      buttonHover?: string;
    };
    m3?: M3Scheme;
  }
}

const getLightPalette = (): PaletteOptions => {
  const m3Light = materialTheme.schemes.light;
  return {
    primary: {
      main: m3Light.primary,
      contrastText: m3Light.onPrimary,
    },
    secondary: {
      main: m3Light.secondary,
      contrastText: m3Light.onSecondary,
    },
    error: {
      main: m3Light.error,
      contrastText: m3Light.onError,
    },
    background: {
      default: m3Light.background,
      paper: m3Light.surface,
    },
    text: {
      primary: m3Light.onSurface,
      secondary: m3Light.onSurfaceVariant,
    },
    overlay: {
      dark: "rgba(0, 0, 0, 0.4)",
      gradient: `linear-gradient(135deg, ${m3Light.background} 0%, ${m3Light.primaryContainer} 100%)`,
      tealGradient: `linear-gradient(135deg, ${m3Light.primary}E6 0%, ${m3Light.secondary}E6 100%)`,
      blur: "rgba(255, 255, 255, 0.8)",
    },
    border: {
      light: m3Light.outlineVariant,
      main: m3Light.outline,
    },
    shadow: {
      card: `0 24px 60px ${m3Light.shadow}1F`,
      cardHover: `0 32px 80px ${m3Light.shadow}33, 0 0 0 1px ${m3Light.outlineVariant}`,
      button: `0 8px 16px ${m3Light.primary}4D`,
      buttonHover: `0 12px 20px ${m3Light.primary}66`,
    },
    m3: m3Light,
  };
};

const getDarkPalette = (): PaletteOptions => {
  const m3Dark = materialTheme.schemes.dark;
  return {
    primary: {
      main: m3Dark.primary,
      contrastText: m3Dark.onPrimary,
    },
    secondary: {
      main: m3Dark.secondary,
      contrastText: m3Dark.onSecondary,
    },
    error: {
      main: m3Dark.error,
      contrastText: m3Dark.onError,
    },
    background: {
      default: m3Dark.background,
      paper: m3Dark.surface,
    },
    text: {
      primary: m3Dark.onSurface,
      secondary: m3Dark.onSurfaceVariant,
    },
    overlay: {
      dark: "rgba(0, 0, 0, 0.7)",
      gradient: `linear-gradient(135deg, ${m3Dark.background} 0%, ${m3Dark.primaryContainer}26 100%)`,
      tealGradient: `linear-gradient(135deg, ${m3Dark.primary}F2 0%, ${m3Dark.secondary}FA 100%)`,
      blur: "rgba(26, 31, 35, 0.8)",
    },
    border: {
      light: m3Dark.outlineVariant,
      main: m3Dark.outline,
    },
    shadow: {
      card: `0 24px 60px ${m3Dark.shadow}66`,
      cardHover: `0 32px 80px ${m3Dark.shadow}99, 0 0 0 1px ${m3Dark.outlineVariant}`,
      button: `0 8px 16px ${m3Dark.shadow}66`,
      buttonHover: `0 12px 20px ${m3Dark.shadow}99`,
    },
    m3: m3Dark,
  };
};

export function createAppTheme(mode: PaletteMode) {
  const isLight = mode === "light";
  const palette = isLight ? getLightPalette() : getDarkPalette();

  const autofillBackground = isLight ? (palette.background?.paper ?? "#ffffff") : "#1a1f23";
  const autofillText = isLight ? (palette.text?.primary ?? "#10212b") : "#e8eaed";

  const primary = palette.primary as SimplePaletteColorOptions;
  const secondary = palette.secondary as SimplePaletteColorOptions;

  const baseTheme = createTheme({
    palette: {
      mode,
      ...palette,
    },
    shape: {
      borderRadius: 20,
    },
    typography: {
      fontFamily: 'var(--font-geist-sans), "Inter", "Segoe UI", sans-serif',
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
        "@media (max-width: 768px)": {
          fontSize: "1rem",
        },
      },
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.5,
        "@media (max-width: 768px)": {
          fontSize: "0.875rem",
        },
      },
      caption: {
        fontSize: "0.75rem",
        lineHeight: 1.4,
        "@media (max-width: 768px)": {
          fontSize: "0.75rem",
        },
      },
      h1: {
        fontWeight: 800,
        letterSpacing: "-0.04em",
        lineHeight: 1,
      },
      h2: {
        fontWeight: 800,
        letterSpacing: "-0.03em",
      },
      h3: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 700,
        fontSize: "1.25rem",
        "@media (max-width: 768px)": {
          fontSize: "1.125rem",
        },
      },
      button: {
        fontWeight: 700,
        textTransform: "none",
        fontSize: "1rem",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isLight
              ? `radial-gradient(circle at top left, ${secondary.main}14, transparent 28%), radial-gradient(circle at top right, ${primary.main}17, transparent 24%)`
              : `radial-gradient(circle at top left, ${secondary.main}26, transparent 28%), radial-gradient(circle at top right, ${primary.main}33, transparent 24%)`,
          },

          "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active, textarea:-webkit-autofill, select:-webkit-autofill":
            {
              WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
              WebkitTextFillColor: `${autofillText} !important`,
              caretColor: autofillText,
              borderRadius: "inherit",
              transition: "background-color 9999s ease-out, color 9999s ease-out",
            },
          "input:autofill, textarea:autofill, select:autofill": {
            boxShadow: `0 0 0 1000px ${autofillBackground} inset`,
            color: autofillText,
          },

          "*::-webkit-scrollbar": {
            width: "8px",
            backgroundColor: "transparent",
          },
          "*::-webkit-scrollbar-track": {
            background: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            borderRadius: "8px",
            margin: "8px 0",
          },
          "*::-webkit-scrollbar-thumb": {
            background: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
            borderRadius: "8px",
            border: mode === "dark" ? "2px solid rgba(30, 30, 30, 0.9)" : "2px solid rgba(255, 255, 255, 0.9)",
          },
          "*::-webkit-scrollbar-thumb:hover": {
            background: mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
          },
          "*": {
            scrollbarWidth: "thin",
            scrollbarColor:
              mode === "dark"
                ? "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            boxShadow: "none",
            paddingLeft: 20,
            paddingRight: 20,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            boxShadow: palette.shadow?.card ?? "none",
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
          fullWidth: true,
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
          input: {
            "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active": {
              WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
              WebkitTextFillColor: `${autofillText} !important`,
              caretColor: autofillText,
            },
          },
        },
      },
    },
  });

  return responsiveFontSizes(baseTheme);
}

export const appTheme = createAppTheme("light");

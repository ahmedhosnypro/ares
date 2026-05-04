import { responsiveFontSizes, createTheme, type PaletteMode, type PaletteOptions } from "@mui/material/styles";
// cspell:ignore onepassword

// Extend the Palette interface to include custom colors
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
    header: {
      background: string;
      border: string;
      buttonHover: string;
      avatarBorder: string;
    };
    footer: {
      background: string;
      text: string;
      title: string;
      divider: string;
      socialBg: string;
      socialText: string;
    };
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
    header?: {
      background?: string;
      border?: string;
      buttonHover?: string;
      avatarBorder?: string;
    };
    footer?: {
      background?: string;
      text?: string;
      title?: string;
      divider?: string;
      socialBg?: string;
      socialText?: string;
    };
  }
}

const lightPalette: PaletteOptions = {
  primary: {
    main: "#0f5b5b",
    dark: "#0a3d3d",
    light: "#2d8b8b",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#b8860b",
    light: "#e0ad2c",
    dark: "#8f6800",
    contrastText: "#10212b",
  },
  background: {
    default: "#f4f6f8",
    paper: "#ffffff",
  },
  text: {
    primary: "#10212b",
    secondary: "#4a5568",
  },
  overlay: {
    dark: "rgba(0, 0, 0, 0.4)",
    gradient: "linear-gradient(135deg, #f4f6f8 0%, rgba(15, 91, 91, 0.05) 100%)",
    tealGradient: "linear-gradient(135deg, rgba(15, 91, 91, 0.85) 0%, rgba(16, 33, 43, 0.90) 100%)",
    blur: "rgba(255, 255, 255, 0.8)",
  },
  border: {
    light: "rgba(15, 91, 91, 0.08)",
    main: "rgba(15, 91, 91, 0.1)",
  },
  shadow: {
    card: "0 24px 60px rgba(15, 91, 91, 0.12)",
    cardHover: "0 32px 80px rgba(15, 91, 91, 0.20), 0 0 0 1px rgba(15, 91, 91, 0.05)",
    button: "0 8px 16px rgba(15, 91, 91, 0.3)",
    buttonHover: "0 12px 20px rgba(15, 91, 91, 0.4)",
  },
  header: {
    background: "rgba(15, 91, 91, 0.95)",
    border: "rgba(255, 255, 255, 0.1)",
    buttonHover: "rgba(255, 255, 255, 0.15)",
    avatarBorder: "rgba(255, 255, 255, 0.3)",
  },
  footer: {
    background: "#1a1f23", // Matching dark paper/grey.900 equivalent
    text: "#b3b9c1",
    title: "#ffffff",
    divider: "rgba(255, 255, 255, 0.1)",
    socialBg: "rgba(255, 255, 255, 0.05)",
    socialText: "#b3b9c1",
  },
};

const darkPalette: PaletteOptions = {
  primary: {
    main: "#4db8b8",
    dark: "#2d8b8b",
    light: "#8fd6d6",
    contrastText: "#0a0e0f",
  },
  secondary: {
    main: "#e0ad2c",
    light: "#f0c968",
    dark: "#b8860b",
    contrastText: "#0a0e0f",
  },
  background: {
    default: "#0a0e0f",
    paper: "#1a1f23",
  },
  text: {
    primary: "#ffffff",
    secondary: "#b3b9c1",
  },
  overlay: {
    dark: "rgba(0, 0, 0, 0.7)",
    gradient: "linear-gradient(135deg, #0a0e0f 0%, rgba(15, 91, 91, 0.15) 100%)",
    tealGradient: "linear-gradient(135deg, rgba(15, 91, 91, 0.95) 0%, rgba(16, 33, 43, 0.98) 100%)",
    blur: "rgba(26, 31, 35, 0.8)",
  },
  border: {
    light: "rgba(255, 255, 255, 0.08)",
    main: "rgba(255, 255, 255, 0.12)",
  },
  shadow: {
    card: "0 24px 60px rgba(0, 0, 0, 0.4)",
    cardHover: "0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    button: "0 8px 16px rgba(0, 0, 0, 0.4)",
    buttonHover: "0 12px 20px rgba(0, 0, 0, 0.6)",
  },
  header: {
    background: "rgba(10, 14, 15, 0.95)",
    border: "rgba(255, 255, 255, 0.05)",
    buttonHover: "rgba(255, 255, 255, 0.15)",
    avatarBorder: "rgba(255, 255, 255, 0.2)",
  },
  footer: {
    background: "#050708", // Darker than background.default
    text: "#b3b9c1",
    title: "#ffffff",
    divider: "rgba(255, 255, 255, 0.05)",
    socialBg: "rgba(255, 255, 255, 0.05)",
    socialText: "#b3b9c1",
  },
};

export function createAppTheme(mode: PaletteMode) {
  const isLight = mode === "light";
  const palette = isLight ? lightPalette : darkPalette;
  const autofillBackground = isLight ? "#ffffff" : "#1a1f23";
  const autofillText = isLight ? "#10212b" : "#e8eaed";

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
      // Improved mobile-first typography scaling
      body1: {
        fontSize: "1rem", // 16px - safe for mobile inputs
        lineHeight: 1.6,
        "@media (max-width: 768px)": {
          fontSize: "1rem", // Keep 16px on mobile for inputs
        },
      },
      body2: {
        fontSize: "0.875rem", // 14px - minimum readable size
        lineHeight: 1.5,
        "@media (max-width: 768px)": {
          fontSize: "0.875rem", // 14px minimum on mobile
        },
      },
      caption: {
        fontSize: "0.75rem", // 12px - absolute minimum
        lineHeight: 1.4,
        "@media (max-width: 768px)": {
          fontSize: "0.75rem", // 12px minimum on mobile
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
        fontSize: "1.25rem", // 20px
        "@media (max-width: 768px)": {
          fontSize: "1.125rem", // 18px on mobile
        },
      },
      button: {
        fontWeight: 700,
        textTransform: "none",
        fontSize: "1rem", // 16px for better touch targets
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isLight
              ? "radial-gradient(circle at top left, rgba(184, 134, 11, 0.08), transparent 28%), radial-gradient(circle at top right, rgba(15, 91, 91, 0.09), transparent 24%)"
              : "radial-gradient(circle at top left, rgba(184, 134, 11, 0.15), transparent 28%), radial-gradient(circle at top right, rgba(15, 91, 91, 0.2), transparent 24%)",
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
          "input[data-com-onepassword-filled], textarea[data-com-onepassword-filled], input[data-com-onepassword-filled='dark'], textarea[data-com-onepassword-filled='dark']":
            {
              backgroundColor: `${autofillBackground} !important`,
              WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
              WebkitTextFillColor: `${autofillText} !important`,
              color: `${autofillText} !important`,
              caretColor: `${autofillText} !important`,
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
            boxShadow: isLight ? "0 24px 60px rgba(16, 33, 43, 0.08)" : "0 24px 60px rgba(0, 0, 0, 0.3)",
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
          input: {
            "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active": {
              WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
              WebkitTextFillColor: `${autofillText} !important`,
              caretColor: autofillText,
            },
            "&[data-com-onepassword-filled], &[data-com-onepassword-filled='dark']": {
              backgroundColor: `${autofillBackground} !important`,
              WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
              WebkitTextFillColor: `${autofillText} !important`,
              color: `${autofillText} !important`,
              caretColor: `${autofillText} !important`,
            },
          },
        },
      },
    },
  });

  return responsiveFontSizes(baseTheme);
}

// Keep the original export for backward compatibility
export const appTheme = createAppTheme("light");

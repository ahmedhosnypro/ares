import { responsiveFontSizes, createTheme } from "@mui/material/styles";

const baseTheme = createTheme({
  palette: {
    mode: "light",
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
      secondary: "#5d6b76",
    },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), "Inter", "Segoe UI", sans-serif',
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
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at top left, rgba(184, 134, 11, 0.08), transparent 28%), radial-gradient(circle at top right, rgba(15, 91, 91, 0.09), transparent 24%)",
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
          boxShadow: "0 24px 60px rgba(16, 33, 43, 0.08)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },
  },
});

export const appTheme = responsiveFontSizes(baseTheme);

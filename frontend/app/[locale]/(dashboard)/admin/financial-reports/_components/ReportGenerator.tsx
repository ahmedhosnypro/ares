import { Card, CardContent, Box, Typography, FormControlLabel, Checkbox, Button } from "@mui/material";
import { Theme } from "@mui/material/styles";
import { GetApp as DownloadIcon } from "@mui/icons-material";

interface ReportGeneratorProps {
  t: (key: string) => string;
  theme: Theme;
  incRevenue: boolean;
  setIncRevenue: (val: boolean) => void;
  incBookings: boolean;
  setIncBookings: (val: boolean) => void;
  incPayments: boolean;
  setIncPayments: (val: boolean) => void;
  incSuppliers: boolean;
  setIncSuppliers: (val: boolean) => void;
  handleExportPrint: () => void;
}

export function ReportGenerator({
  t,
  theme,
  incRevenue,
  setIncRevenue,
  incBookings,
  setIncBookings,
  incPayments,
  setIncPayments,
  incSuppliers,
  setIncSuppliers,
  handleExportPrint,
}: Readonly<ReportGeneratorProps>) {
  return (
    <Card
      dir={theme.direction === "rtl" ? "rtl" : "ltr"}
      sx={{
        height: "100%",
        boxShadow: theme.palette.shadow.card,
        borderRadius: 2,
        border: `1px solid ${theme.palette.border.light}`,
        textAlign: theme.direction === "rtl" ? "right" : "left",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, color: "text.primary", mb: 2.5, fontSize: "0.95rem" }}>
            {t("generateCustomReport")}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={incRevenue}
                  onChange={e => {
                    setIncRevenue(e.target.checked);
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t("includeRevenue")}</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={incBookings}
                  onChange={e => {
                    setIncBookings(e.target.checked);
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t("includeBookings")}</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={incPayments}
                  onChange={e => {
                    setIncPayments(e.target.checked);
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t("includePayments")}</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={incSuppliers}
                  onChange={e => {
                    setIncSuppliers(e.target.checked);
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t("includeSuppliers")}</Typography>}
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleExportPrint}
          disabled={!incRevenue && !incBookings && !incPayments && !incSuppliers}
          sx={{
            borderRadius: 2,
            py: 1.25,
            mt: 3,
            fontSize: "0.78rem",
            fontWeight: 800,
            boxShadow: theme.palette.shadow.button,
            "&:hover": {
              boxShadow: theme.palette.shadow.buttonHover,
            },
          }}
        >
          {t("exportPdf")}
        </Button>
      </CardContent>
    </Card>
  );
}

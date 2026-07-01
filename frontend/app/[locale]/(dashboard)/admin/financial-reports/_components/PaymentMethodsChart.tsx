import { Card, CardContent, Typography, Box } from "@mui/material";
import { Theme } from "@mui/material/styles";
import { ResponsiveContainer, PieChart, Pie } from "recharts";
import { FinancialReportsData } from "./types";

interface PaymentMethodsChartProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
  donutColors: string[];
}

export function PaymentMethodsChart({ data, isRtl, t, theme, donutColors }: Readonly<PaymentMethodsChartProps>) {
  // Pre-calculate colors and add them to data, resolving the Recharts Cell deprecation warning
  const paymentMethodsWithColors = data.paymentMethods.map((entry, index) => ({
    ...entry,
    amount: entry.paidAmount, // Make sure amount maps properly to Pie's dataKey
    fill: donutColors[index % donutColors.length],
  }));

  return (
    <Card
      dir={isRtl ? "rtl" : "ltr"}
      sx={{
        height: "100%",
        boxShadow: theme.palette.shadow.card,
        borderRadius: 2,
        border: `1px solid ${theme.palette.border.light}`,
        textAlign: isRtl ? "right" : "left",
      }}
    >
      <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", mb: 2, fontSize: "0.95rem" }}>
          {t("paymentMethods")}
        </Typography>
        {data.paymentMethods.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ position: "relative", width: 130, height: 130, mb: 2 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={paymentMethodsWithColors}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="amount"
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Content */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                  }}
                >
                  {t("amount")}
                </Typography>
                <Typography sx={{ fontWeight: 900, color: "primary.main", fontSize: "0.9rem" }}>
                  {data.paidAmount.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ width: "100%", mt: 1 }}>
              {paymentMethodsWithColors.map(entry => (
                <Box
                  key={entry.method}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: entry.fill,
                      }}
                    />
                    <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.75rem" }}>
                      {entry.method}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: "text.secondary", fontWeight: 800, fontSize: "0.75rem" }}>
                    {entry.percentage}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4, fontSize: "0.8rem" }}>
            {t("noData")}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, Typography, Box, useTheme, Select, MenuItem, FormControl } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Label, Sector } from "recharts";
import { VehicleStatusData, mockCityVehicleData } from "./mockData";

export default function VehicleStatusChart({ data }: { readonly data: readonly VehicleStatusData[] }) {
  const theme = useTheme();
  const [selectedCity, setSelectedCity] = useState("All Cities");

  // Helper to extract theme colors using string paths (e.g. "status.active.main")
  const getThemeColor = (path: string): string => {
    const parts = path.split(".");
    let current: unknown = theme.palette;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return theme.palette.primary.main;
      }
    }
    return typeof current === "string" ? current : theme.palette.primary.main;
  };

  const displayData = selectedCity === "All Cities" ? data : mockCityVehicleData[selectedCity];
  const totalVehicles = displayData.reduce((acc, curr) => acc + curr.value, 0);
  const cities = Object.keys(mockCityVehicleData).filter(city => city !== "All Cities");

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        boxShadow: theme.palette.shadow.card,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Vehicle Status
          </Typography>
          <FormControl size="small" sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Select
              value={selectedCity}
              onChange={e => {
                setSelectedCity(e.target.value);
              }}
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              <MenuItem value="All Cities">All Cities</MenuItem>
              {cities.map(city => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: "100%", height: 300, minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                shape={(props: unknown) => {
                  const p = props as { payload: { color: string } } & Record<string, unknown>;
                  return <Sector {...p} fill={getThemeColor(p.payload.color)} />;
                }}
              >
                <Label
                  content={props => {
                    const viewBox = props.viewBox;
                    if (
                      viewBox &&
                      "cx" in viewBox &&
                      "cy" in viewBox &&
                      typeof viewBox.cx === "number" &&
                      typeof viewBox.cy === "number"
                    ) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="central">
                          <tspan x={viewBox.cx} y={viewBox.cy - 10} fontSize="14" fill={theme.palette.text.secondary}>
                            Total
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy + 18}
                            fontSize="28"
                            fontWeight="bold"
                            fill={theme.palette.text.primary}
                          >
                            {totalVehicles}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${theme.palette.border.main}`,
                  boxShadow: theme.palette.shadow.card,
                  backgroundColor: theme.palette.background.paper,
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

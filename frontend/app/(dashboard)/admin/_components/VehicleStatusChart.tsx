"use client";

import React, { useState } from "react";
import { Card, CardContent, Typography, Box, useTheme, Select, MenuItem, FormControl } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, Label } from "recharts";
import { VehicleStatusData, mockCityVehicleData } from "./mockData";

export default function VehicleStatusChart({ data }: { data: VehicleStatusData[] }) {
  const theme = useTheme();
  const [selectedCity, setSelectedCity] = useState("All Cities");

  // Helper to extract theme colors using string paths (e.g. "status.active.main")
  const getThemeColor = (path: string) => {
    return path.split('.').reduce((o, i) => (o as any)?.[i], theme.palette) as unknown as string || theme.palette.primary.main;
  };

  const displayData = selectedCity === "All Cities" ? data : (mockCityVehicleData[selectedCity] || data);
  const totalVehicles = displayData.reduce((acc, curr) => acc + curr.value, 0);
  const cities = Object.keys(mockCityVehicleData);

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
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 2, sm: 0 }, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Vehicle Status
          </Typography>
          <FormControl size="small" sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as string)}
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              {cities.map((city) => (
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
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getThemeColor(entry.color)} />
                ))}
                <Label
                  content={(props: any) => {
                    const { viewBox } = props;
                    if (viewBox && viewBox.cx && viewBox.cy) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="central">
                          <tspan x={viewBox.cx} y={viewBox.cy - 10} fontSize="14" fill={theme.palette.text.secondary}>
                            Total
                          </tspan>
                          <tspan x={viewBox.cx} y={viewBox.cy + 18} fontSize="28" fontWeight="bold" fill={theme.palette.text.primary}>
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
                  backgroundColor: theme.palette.background.paper
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

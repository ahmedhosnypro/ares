"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, Typography, Box, LinearProgress, IconButton, CircularProgress } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface SystemMetric {
  readonly label: string;
  readonly value: string;
  readonly amount: number;
  readonly color: string;
}

interface SystemStatus {
  readonly isOperational: boolean;
  readonly message: string;
  readonly metrics: readonly SystemMetric[];
}

export default function SystemStatusCard() {
  const { data: session, status } = useSession();
  const [systemData, setSystemData] = useState<SystemStatus | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session.accessToken) return;

    const fetchStatus = async () => {
      try {
        const result = await apiFetchJson<SystemStatus>("api/dashboard/system-status", {
          accessToken: session.accessToken,
        });
        setSystemData(result);
      } catch (error) {
        logger.error("Failed to fetch system status", error);
      }
    };

    void fetchStatus();
    const interval = setInterval(() => {
      void fetchStatus();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [session?.accessToken, status]);

  if (!systemData) {
    return (
      <Card
        elevation={0}
        sx={{ borderRadius: 4, border: "1px solid", borderColor: "border.main", height: "100%", mt: 3 }}
      >
        <CardContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "border.main",
        height: "100%",
        mt: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            System Status
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 2 }}>
          {systemData.metrics.map((item, i) => (
            <Box key={i}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }} color={`${item.color}.main`}>
                  {item.value}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.amount}
                color={item.color as "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "action.hover",
                }}
              />
            </Box>
          ))}

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 3,
              bgcolor: systemData.isOperational ? "success.lighter" : "error.lighter",
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            {systemData.isOperational ? <TaskAltIcon color="success" /> : <ErrorOutlinedIcon color="error" />}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold" }}
                color={systemData.isOperational ? "success.main" : "error.main"}
              >
                {systemData.isOperational ? "All Systems Operational" : "System Issues Detected"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {systemData.message}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

"use client";

/* eslint-disable sonarjs/pseudo-random */

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Alert as MuiAlert,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  ShieldOutlined as ShieldIcon,
  ReportProblem as AlertIcon,
  TrackChanges as FimIcon,
  HistoryToggleOff as HistoryIcon,
  CheckCircle as HealthyIcon,
  Circle as LiveIcon,
} from "@mui/icons-material";

interface TransactionFeedItem {
  id: string;
  minutesAgo: number;
  amount: string;
  status: "safe" | "flagged" | "blocked";
  actionKey: "none" | "threeDSecure" | "ipBlocked" | "fraudScoreRejected" | "reviewTriggered";
}

const INITIAL_TRANSACTIONS: readonly TransactionFeedItem[] = [
  { id: "TX-4892", minutesAgo: 0, amount: "$350.00", status: "safe", actionKey: "none" },
  { id: "TX-4891", minutesAgo: 2, amount: "$1,200.00", status: "flagged", actionKey: "threeDSecure" },
  { id: "TX-4890", minutesAgo: 5, amount: "$45.00", status: "safe", actionKey: "none" },
  { id: "TX-4889", minutesAgo: 12, amount: "$850.00", status: "blocked", actionKey: "ipBlocked" },
  { id: "TX-4888", minutesAgo: 18, amount: "$150.00", status: "safe", actionKey: "none" },
];

function updateTransactions(
  prev: readonly TransactionFeedItem[],
  newItem: TransactionFeedItem
): readonly TransactionFeedItem[] {
  const updatedPrev = prev.map((item, idx) => ({
    ...item,
    minutesAgo: idx + 1,
  }));
  return [newItem, ...updatedPrev.slice(0, 7)];
}

export default function SecurityView() {
  const t = useTranslations("dashboardAdmin.admin.security");
  const tCommon = useTranslations("common");
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState<readonly TransactionFeedItem[]>(INITIAL_TRANSACTIONS);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Live transaction simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const id = `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`;
      const amount = `$${(Math.random() * 1000 + 10).toFixed(2)}`;
      const rand = Math.random();
      const status: "safe" | "flagged" | "blocked" = rand > 0.85 ? "blocked" : rand > 0.7 ? "flagged" : "safe";
      const actionKey: "none" | "threeDSecure" | "ipBlocked" | "fraudScoreRejected" | "reviewTriggered" =
        status === "blocked" ? "fraudScoreRejected" : status === "flagged" ? "reviewTriggered" : "none";

      const newItem: TransactionFeedItem = {
        id,
        minutesAgo: 0,
        amount,
        status,
        actionKey,
      };

      setTransactions(prev => updateTransactions(prev, newItem));
    }, 8000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
            {t("title")}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {t("subtitle")}
          </Typography>
        </Box>
        <Chip
          icon={<LiveIcon sx={{ fill: theme.palette.success.main, animation: "blink 1.5s infinite" }} />}
          label={t("liveFeedSection.liveFeedMonitor")}
          variant="outlined"
          sx={{
            fontWeight: 700,
            borderColor: "success.main",
            color: "success.main",
            "& .MuiChip-icon": { color: "success.main" },
            "@keyframes blink": {
              "0%": { opacity: 0.3 },
              "50%": { opacity: 1 },
              "100%": { opacity: 0.3 },
            },
          }}
        />
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Security Score */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
          >
            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
              <Avatar sx={{ bgcolor: "success.light", color: "success.main", width: 56, height: 56 }}>
                <ShieldIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}
                >
                  {t("statsSection.securityScore")}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 850, color: "text.primary" }}>
                  98/100
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Threats */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
          >
            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
              <Avatar sx={{ bgcolor: "status.active.light", color: "status.active.main", width: 56, height: 56 }}>
                <AlertIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}
                >
                  {t("statsSection.activeThreats")}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 850, color: "text.primary" }}>
                  0
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* File Integrity Violations */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
          >
            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
              <Avatar sx={{ bgcolor: "status.completed.light", color: "status.completed.main", width: 56, height: 56 }}>
                <FimIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}
                >
                  {t("statsSection.integrityViolations")}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 850, color: "text.primary" }}>
                  0
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Logs Recorded */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
          >
            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
              <Avatar sx={{ bgcolor: "primary.light", color: "primary.main", width: 56, height: 56 }}>
                <HistoryIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}
                >
                  {t("statsSection.auditLogsCount")}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 850, color: "text.primary" }}>
                  1,489
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Menu */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{
              "& .MuiTab-root": { fontWeight: 700, fontSize: "0.95rem", py: 2 },
            }}
          >
            <Tab label={t("liveFeedSection.title")} />
            <Tab label={t("intrusionAlertsSection.title")} />
            <Tab label={t("fileIntegritySection.title")} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Tab 1: Live Feed */}
          {activeTab === 0 && (
            <Box>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t("liveFeedSection.time")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("liveFeedSection.transactionId")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("liveFeedSection.amount")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("liveFeedSection.status")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("liveFeedSection.action")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map(tx => (
                      <TableRow key={tx.id} hover>
                        <TableCell>
                          {tx.minutesAgo === 0
                            ? t("liveFeedSection.times.justNow")
                            : tx.minutesAgo === 1
                              ? t("liveFeedSection.times.oneMinAgo")
                              : t("liveFeedSection.times.minsAgo", { count: tx.minutesAgo })}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{tx.id}</TableCell>
                        <TableCell>{tx.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              tx.status === "safe"
                                ? t("liveFeedSection.safe")
                                : tx.status === "flagged"
                                  ? t("liveFeedSection.flagged")
                                  : t("liveFeedSection.blocked")
                            }
                            color={tx.status === "safe" ? "success" : tx.status === "flagged" ? "warning" : "error"}
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: tx.status === "blocked" ? "error.main" : "text.primary" }}>
                          {t(`liveFeedSection.actions.${tx.actionKey}`)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 2: Intrusion Detection Alerts */}
          {activeTab === 1 && (
            <Box>
              <MuiAlert severity="info" icon={<HealthyIcon />} sx={{ borderRadius: 2, mb: 3 }}>
                {t("intrusionAlertsSection.noAlerts")}
              </MuiAlert>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t("intrusionAlertsSection.tableHeaderTimestamp")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("intrusionAlertsSection.alertType")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("intrusionAlertsSection.severity")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("intrusionAlertsSection.description")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        {tCommon("status")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>{t("intrusionAlertsSection.alerts.xss.time")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("intrusionAlertsSection.alerts.xss.type")}</TableCell>
                      <TableCell>
                        <Chip
                          label={t("intrusionAlertsSection.medium")}
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>{t("intrusionAlertsSection.alerts.xss.desc")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("intrusionAlertsSection.resolved")}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>{t("intrusionAlertsSection.alerts.rateLimit.time")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {t("intrusionAlertsSection.alerts.rateLimit.type")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t("intrusionAlertsSection.low")}
                          color="info"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>{t("intrusionAlertsSection.alerts.rateLimit.desc")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("intrusionAlertsSection.resolved")}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 3: File Integrity Monitoring */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <HealthyIcon color="success" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("fileIntegritySection.title")}: {t("fileIntegritySection.healthy")}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("fileIntegritySection.lastChecked")}
                </Typography>
              </Box>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t("fileIntegritySection.tableHeaderPath")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("fileIntegritySection.tableHeaderHash")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("fileIntegritySection.tableHeaderModified")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        {tCommon("status")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell sx={{ fontFamily: "monospace" }}>/frontend/next.config.ts</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>a9f3b89c...2f01</TableCell>
                      <TableCell>{t("fileIntegritySection.files.nextConfig.modified")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("fileIntegritySection.unchanged")}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontFamily: "monospace" }}>/frontend/package.json</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>38de8f12...e81c</TableCell>
                      <TableCell>{t("fileIntegritySection.files.packageJson.modified")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("fileIntegritySection.unchanged")}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontFamily: "monospace" }}>/frontend/.env.production</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>bf392d41...776f</TableCell>
                      <TableCell>{t("fileIntegritySection.files.envProd.modified")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("fileIntegritySection.unchanged")}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

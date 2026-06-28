"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  LinearProgress,
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
  CircularProgress,
  Backdrop,
  Alert,
  alpha,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  VerifiedUser as VerifiedIcon,
  Shield as ShieldIcon,
  Assignment as SAQIcon,
  Description as ReportIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

export default function ComplianceView() {
  const t = useTranslations("dashboardAdmin.admin.compliance");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const triggerScan = () => {
    setIsScanning(true);
    setScanSuccess(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
    }, 3000);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
          {t("title")}
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {t("subtitle")}
        </Typography>
      </Box>

      {/* Top Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Overall Status */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 2 }}>
                {t("statusSection.overallStatus")}
              </Typography>
              <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={94}
                  size={90}
                  thickness={6}
                  sx={{ color: "status.active.main" }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                    94%
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                label={t("statusSection.compliant")}
                color="success"
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* SAQ Progress */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              height: "100%",
            }}
          >
            <CardContent
              sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                    {t("saqSection.title")}
                  </Typography>
                  <SAQIcon sx={{ color: "primary.main" }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
                  85%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={85}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                    mb: 1.5,
                  }}
                />
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {t("saqSection.questionsRemaining", { count: 18 })}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                fullWidth
                sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}
              >
                {t("saqSection.continueButton")}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Scan Status */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              height: "100%",
            }}
          >
            <CardContent
              sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                    {t("scansSection.title")}
                  </Typography>
                  <VerifiedIcon sx={{ color: "status.active.main" }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "status.active.main", mb: 1 }}>
                  {t("scansSection.passed")}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                  {t("scansSection.lastScan")}: 24 Jun 2026
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {t("scansSection.findings")}: 0 High | 2 Med | 5 Low
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                onClick={triggerScan}
                sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}
              >
                {t("scansSection.runScanButton")}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Penetration Testing */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              height: "100%",
            }}
          >
            <CardContent
              sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                    {t("penTestSection.title")}
                  </Typography>
                  <ShieldIcon sx={{ color: "secondary.main" }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
                  {t("penTestSection.active")}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                  {t("penTestSection.lastTest")}: 15 Jun 2026
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("penTestSection.status")}: Clean / Remediated
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                fullWidth
                sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}
              >
                {t("penTestSection.scheduleButton")}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs / Detailed View */}
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
            <Tab label={t("saqSection.title")} />
            <Tab label={t("scansSection.title")} />
            <Tab label={t("reportsSection.title")} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Tab 1: SAQ */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {t("saqSection.tabTitle")}
                </Typography>
                <Chip label={t("saqSection.requirementSubtitle")} variant="outlined" size="small" />
              </Box>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t("saqSection.tableHeaderId")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("saqSection.tableHeaderDescription")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        {tCommon("status")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 600 }}>REQ 3.1</TableCell>
                      <TableCell>{t("saqSection.req3_1.desc")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("statusSection.compliant")}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 600 }}>REQ 3.4</TableCell>
                      <TableCell>{t("saqSection.req3_4.desc")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("statusSection.compliant")}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 600 }}>REQ 4.1</TableCell>
                      <TableCell>{t("saqSection.req4_1.desc")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("statusSection.compliant")}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 600 }}>REQ 6.2</TableCell>
                      <TableCell>{t("saqSection.req6_2.desc")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("saqSection.inProgress")}
                          color="warning"
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

          {/* Tab 2: Scans */}
          {activeTab === 1 && (
            <Box>
              {scanSuccess && (
                <Alert
                  severity="success"
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => {
                    setScanSuccess(false);
                  }}
                >
                  {t("scansSection.scanSuccessAlert")}
                </Alert>
              )}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {t("scansSection.recentLogsTitle")}
                </Typography>
                <Button startIcon={<RefreshIcon />} size="small" variant="outlined" onClick={triggerScan}>
                  {t("scansSection.refreshButton")}
                </Button>
              </Box>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t("scansSection.tableHeaderDate")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("scansSection.tableHeaderTarget")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("scansSection.findings")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        {tCommon("status")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>{t("scansSection.log1.date")}</TableCell>
                      <TableCell>{t("scansSection.log1.target")}</TableCell>
                      <TableCell>{t("scansSection.log1.findings")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("scansSection.passed").toUpperCase()}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>{t("scansSection.log2.date")}</TableCell>
                      <TableCell>{t("scansSection.log2.target")}</TableCell>
                      <TableCell>{t("scansSection.log2.findings")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("scansSection.passed").toUpperCase()}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>{t("scansSection.log3.date")}</TableCell>
                      <TableCell>{t("scansSection.log3.target")}</TableCell>
                      <TableCell>{t("scansSection.log3.findings")}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t("scansSection.passed").toUpperCase()}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 3: Reports */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 3 }}>
                {t("reportsSection.generatedReportsTitle")}
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: theme => alpha(theme.palette.success.main, 0.1),
                            color: "status.active.main",
                            borderRadius: 2,
                          }}
                        >
                          <ReportIcon />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                            {t("reportsSection.downloadRoC")}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                            {t("reportsSection.rocDescription")}
                          </Typography>
                          <Button startIcon={<DownloadIcon />} variant="outlined" size="small">
                            {t("reportsSection.downloadPdfButton")}
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: theme => alpha(theme.palette.success.main, 0.1),
                            color: "status.active.main",
                            borderRadius: 2,
                          }}
                        >
                          <ReportIcon />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                            {t("reportsSection.downloadAoC")}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                            {t("reportsSection.aocDescription")}
                          </Typography>
                          <Button startIcon={<DownloadIcon />} variant="outlined" size="small">
                            {t("reportsSection.downloadPdfButton")}
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Backdrop scanning */}
      <Backdrop
        sx={{
          color: theme => theme.palette.common.white,
          zIndex: theme => theme.zIndex.drawer + 99,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        open={isScanning}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("scansSection.scanningBackdropText")}
        </Typography>
      </Backdrop>
    </Box>
  );
}

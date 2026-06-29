"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Stack,
  CircularProgress,
  InputAdornment,
  Pagination,
  Tooltip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import {
  DeleteOutlineRounded as DeleteIcon,
  SearchRounded as SearchIcon,
  PublicTwoTone as CountryIcon,
  MapTwoTone as MapIcon,
  Add as AddIcon,
  VisibilityTwoTone as ViewIcon,
} from "@mui/icons-material";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCountries, checkCountry, deleteCountry, type Country } from "@/api-clients/countries/countries";
import VehicleStats from "@/app/[locale]/(dashboard)/_components/VehicleStats";

// ── MAIN PAGE ──
export default function AdminCountriesPage() {
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.countries");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── FETCH COUNTRY CODES FOR CDN ──
  const [countryCodes, setCountryCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("https://flagcdn.com/en/codes.json")
      .then(res => res.json())
      .then((data: Record<string, string>) => {
        const reversed = Object.entries(data).reduce<Record<string, string>>((acc, [code, name]) => {
          acc[name.toLowerCase()] = code;
          return acc;
        }, {});

        // Add common aliases
        reversed["usa"] = "us";
        reversed["uk"] = "gb";
        reversed["uae"] = "ae";

        setCountryCodes(reversed);
      })
      .catch((_err: unknown) => {
        // Ignoring the error silently to fall back to the icon
      });
  }, []);

  const { countries, loading, page, totalPages, totalRecords, setPage, search, setSearch, refresh } = useCountries(
    session?.accessToken
  );

  const countryStatsItems = useMemo(
    () => [
      {
        label: t("stats.totalCountries"),
        value: totalRecords,
        color: "primary",
        icon: <CountryIcon fontSize="small" />,
      },
      {
        label: t("stats.activeRegions"),
        value: totalRecords,
        subtitle: t("stats.activeRegionsDesc"),
        color: "success",
        icon: <MapIcon fontSize="small" />,
      },
    ],
    [totalRecords, t]
  );

  // ── HANDLERS ──
  const handleDeleteClick = useCallback(
    async (id: string) => {
      if (!session?.accessToken) return;

      try {
        const { canDelete, message } = await checkCountry(session.accessToken, id);
        if (!canDelete) {
          setErrorMsg(message || t("alerts.cannotDelete"));
          return;
        }

        setDeleteId(id);
        setOpenDelete(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t("alerts.checkError");
        setErrorMsg(message);
      }
    },
    [session, t]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId || !session?.accessToken) return;
    try {
      await deleteCountry(session.accessToken, deleteId);
      setSuccessMsg(t("alerts.deleteSuccess"));
      setOpenDelete(false);
      setDeleteId(null);
      refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("alerts.deleteError");
      setErrorMsg(message);
    }
  }, [deleteId, session, refresh, t]);

  const handleCloseDelete = useCallback(() => {
    setOpenDelete(false);
  }, []);
  const handleCloseError = useCallback(() => {
    setErrorMsg(null);
  }, []);
  const handleCloseSuccess = useCallback(() => {
    setSuccessMsg(null);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          justifyContent: "space-between",
          mb: 4,
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem" } }}>
            {t("title")}
          </Typography>
          <Typography color="text.secondary">{t("subtitle")}</Typography>
        </Box>
        <Link href="/admin/countries/create" passHref style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              boxShadow: theme => theme.palette.shadow.button,
              "&:hover": {
                boxShadow: theme => theme.palette.shadow.buttonHover,
              },
            }}
          >
            {t("addCountry")}
          </Button>
        </Link>
      </Stack>

      {/* STATS */}
      <VehicleStats items={countryStatsItems} />

      {/* FILTER */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1); // Reset to page 1 on search
          }}
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {/* TABLE */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.04),
                    "& .MuiTableCell-head": {
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "text.secondary",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      py: 1.5,
                    },
                  }}
                >
                  <TableCell sx={{ pl: 6 }}>{t("table.headers.countryName")}</TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
                    {t("table.headers.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {countries.length > 0 ? (
                  countries.map((c: Country) => (
                    <TableRow
                      key={c._id}
                      hover
                      sx={{
                        transition: "background 0.15s",
                        "&:last-child td": { border: 0 },
                        "&:hover": {
                          bgcolor: theme => alpha(theme.palette.primary.main, 0.03),
                        },
                      }}
                    >
                      <TableCell sx={{ py: { xs: 1.2, sm: 1.8 } }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", pl: 4 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              overflow: "hidden",
                              flexShrink: 0,
                              bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {countryCodes[c.name.toLowerCase()] ? (
                              <Box
                                component="img"
                                src={`https://flagcdn.com/w40/${countryCodes[c.name.toLowerCase()]}.png`}
                                srcSet={`https://flagcdn.com/w80/${countryCodes[c.name.toLowerCase()]}.png 2x`}
                                alt={c.name}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <CountryIcon fontSize="small" color="primary" />
                            )}
                          </Box>
                          <Link
                            href={`/admin/countries/${c._id}`}
                            passHref
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: { xs: 13, sm: 15 },
                                "&:hover": { color: "primary.main" },
                                transition: "color 0.15s",
                              }}
                            >
                              {c.name}
                            </Typography>
                          </Link>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title={t("actions.viewDetails")}>
                          <Link href={`/admin/countries/${c._id}`} passHref style={{ textDecoration: "none" }}>
                            <IconButton
                              size="small"
                              sx={{
                                borderRadius: 2,
                                color: "primary.main",
                                mr: 1,
                                "&:hover": {
                                  bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                                },
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Link>
                        </Tooltip>
                        <Tooltip title={t("actions.delete")}>
                          <IconButton
                            onClick={() => {
                              void handleDeleteClick(c._id);
                            }}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              "&:hover": {
                                bgcolor: theme => alpha(theme.palette.error.main, 0.1),
                                color: "error.main",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 10 }}>
                      <Box sx={{ textAlign: "center", opacity: 0.6 }}>
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            mx: "auto",
                            mb: 2,
                            bgcolor: theme => alpha(theme.palette.text.disabled, 0.1),
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 32, color: "text.disabled" }} />
                        </Avatar>
                        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                          {t("table.empty")}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {t.rich("table.showing", {
                        count: countries.length,
                        total: totalRecords,
                        strong: chunks => <strong>{chunks}</strong>,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {totalPages > 1 && (
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, v) => {
                          setPage(v);
                        }}
                        size="small"
                        sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* DELETE DIALOG */}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1, minWidth: 350 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("deleteDialog.title")}</DialogTitle>
        <DialogContent>
          {t("deleteDialog.description")}
          <br />
          <strong>{t("deleteDialog.notice")}</strong>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} variant="outlined" sx={{ borderRadius: 2 }}>
            {t("deleteDialog.cancel")}
          </Button>
          <Button
            onClick={() => {
              void confirmDelete();
            }}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {t("deleteDialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ERROR SNACKBAR */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" onClose={handleCloseError}>
          {errorMsg}
        </Alert>
      </Snackbar>

      {/* SUCCESS SNACKBAR */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" onClose={handleCloseSuccess}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

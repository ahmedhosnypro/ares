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
} from "@mui/icons-material";
import { useSession } from "next-auth/react";
import { useCountries, checkCountry, deleteCountry, type Country } from "@/api-clients/countries/countries";
import VehicleStats from "@/app/[locale]/(dashboard)/_components/VehicleStats";

// ── MAIN PAGE ──
export default function AdminCountriesPage() {
  const { data: session } = useSession();

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
        label: "Total Countries",
        value: totalRecords,
        color: "primary",
        icon: <CountryIcon fontSize="small" />,
      },
      {
        label: "Active Regions",
        value: totalRecords, // Approximation since countries are derived from active locations
        color: "success",
        icon: <MapIcon fontSize="small" />,
      },
    ],
    [totalRecords]
  );

  // ── HANDLERS ──
  const handleDeleteClick = useCallback(
    async (id: string) => {
      if (!session?.accessToken) return;

      try {
        const { canDelete, message } = await checkCountry(session.accessToken, id);
        if (!canDelete) {
          setErrorMsg(message || "This country cannot be deleted because it has locations.");
          return;
        }

        setDeleteId(id);
        setOpenDelete(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to check country status.";
        setErrorMsg(message);
      }
    },
    [session]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId || !session?.accessToken) return;
    try {
      await deleteCountry(session.accessToken, deleteId);
      setSuccessMsg("Country deleted successfully.");
      setOpenDelete(false);
      setDeleteId(null);
      refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete country.";
      setErrorMsg(message);
    }
  }, [deleteId, session, refresh]);

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
            Countries
          </Typography>
          <Typography color="text.secondary">Manage available countries for locations</Typography>
        </Box>
      </Stack>

      {/* STATS */}
      <VehicleStats items={countryStatsItems} />

      {/* FILTER */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search country by name..."
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
                  <TableCell sx={{ pl: 6 }}>Country Name</TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
                    Actions
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
                          <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 } }}>{c.name}</Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Delete Country">
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
                          No countries found
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
                      Showing <strong>{countries.length}</strong> of {totalRecords} countries
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
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Country</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this country?
          <br />
          <strong>This action cannot be undone.</strong>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void confirmDelete();
            }}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Delete
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

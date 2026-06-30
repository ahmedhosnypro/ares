"use client";

import {
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  EditRounded as EditIcon,
  LocationOnTwoTone as LocationIcon,
  MapTwoTone as MapIcon,
  OpenInNewRounded as OpenInNewIcon,
  SearchRounded as SearchIcon,
} from "@mui/icons-material";
import {
  Avatar,
  alpha,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import type { Theme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { memo, type SyntheticEvent, useCallback, useState } from "react";
import { deleteLocation, type Location, useLocations } from "@/api-clients/locations/locations";
import { Link, useRouter } from "@/shared/i18n/routing";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

const StatCard = memo(function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
        background: theme =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(color, 0.08)} 100%)`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: () => `0 8px 24px ${alpha(color, 0.18)}`,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -18,
          right: -18,
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: alpha(color, 0.1),
        }}
      />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.15), color, width: 40, height: 40 }}>{icon}</Avatar>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {label}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color,
              lineHeight: 1.1,
              fontSize: { xs: "1.6rem", sm: "2.125rem" },
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
});

const ActionButtons = memo(function ActionButtons({
  locationId,
  onDelete,
  onNavigate,
  viewOnSearchLabel,
  editLabel,
  deleteLabel,
}: {
  locationId: string;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
  viewOnSearchLabel: string;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
      <Tooltip title={viewOnSearchLabel}>
        <IconButton
          size="small"
          component={Link}
          href={`/search?pickupLocationId=${locationId}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderRadius: 2 }}
        >
          <OpenInNewIcon sx={{ fontSize: "small" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title={editLabel}>
        <IconButton
          size="small"
          onClick={() => {
            onNavigate(`/admin/locations/${locationId}/edit`);
          }}
          sx={{ borderRadius: 2 }}
        >
          <EditIcon sx={{ fontSize: "small" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title={deleteLabel}>
        <IconButton
          onClick={() => {
            onDelete(locationId);
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
          <DeleteIcon sx={{ fontSize: "small" }} color="error" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
});

const LocationMobileCard = memo(function LocationMobileCard({
  loc,
  theme,
  onDelete,
  onNavigate,
  primaryLabel,
  viewOnSearchLabel,
  editLabel,
  deleteLabel,
}: {
  loc: Location;
  theme: Theme;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
  primaryLabel: string;
  viewOnSearchLabel: string;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "background 0.15s",
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            overflow: "hidden",
            flexShrink: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loc.imageUrl ? (
            <Box
              component="img"
              src={toImageUrl(loc.imageUrl)}
              alt={loc.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <LocationIcon color="primary" sx={{ fontSize: "small" }} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Link href={`/admin/locations/${loc.id}/edit`} style={{ textDecoration: "none" }}>
            <Typography
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: 15,
                color: "primary.main",
                display: "inline",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {loc.name}
            </Typography>
          </Link>
          <br />
          <Typography variant="caption" color="text.secondary" noWrap>
            {loc.addressLine}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip size="small" label={loc.city} variant="outlined" />
        <Chip size="small" label={loc.country} variant="outlined" />
        {loc.isPrimary && <Chip size="small" label={primaryLabel} color="primary" sx={{ fontWeight: 600 }} />}
      </Stack>

      <ActionButtons
        locationId={loc.id}
        onDelete={onDelete}
        onNavigate={onNavigate}
        viewOnSearchLabel={viewOnSearchLabel}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
      />
    </Paper>
  );
});

export default function AdminLocationsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const t = useTranslations("dashboardAdmin.locationsForm");
  const tc = useTranslations("common");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { locations, loading, page, totalPages, setPage, search, setSearch, setLocations } = useLocations(
    session?.accessToken
  );

  const handleDelete = useCallback((id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      const accessToken = session?.accessToken;
      if (!accessToken) return;
      await deleteLocation(accessToken, deleteId);

      setLocations(prev => prev.filter(loc => loc.id !== deleteId));
      setOpenDelete(false);
      setDeleteId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("deleteErrorMessage");
      setErrorMsg(errorMessage);
      logger.error(t("deleteErrorMessage"), err);
    }
  }, [deleteId, session, setLocations, t]);

  const handleCloseDelete = useCallback(() => {
    setOpenDelete(false);
  }, []);
  const handleCloseError = useCallback(() => {
    setErrorMsg(null);
  }, []);
  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const renderLocations = () => {
    if (loading) {
      return (
        <Box sx={{ justifyContent: "center", display: "flex", py: 10 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (isMobile) {
      if (locations.length === 0) {
        return (
          <Box sx={{ opacity: 0.6, textAlign: "center", py: 8 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
                bgcolor: t => alpha(t.palette.text.disabled, 0.1),
              }}
            >
              <SearchIcon sx={{ fontSize: 32, color: "text.disabled" }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t("noLocationsFound")}
            </Typography>
          </Box>
        );
      }

      return (
        <Box>
          {locations.map((loc: Location, i: number) => (
            <LocationMobileCard
              key={`${loc.id}-${String(i)}`}
              loc={loc}
              theme={theme}
              onDelete={handleDelete}
              onNavigate={handleNavigate}
              primaryLabel={t("primary")}
              viewOnSearchLabel={t("viewOnSearch")}
              editLabel={tc("edit")}
              deleteLabel={tc("delete")}
            />
          ))}

          <Stack direction="column" spacing={1} sx={{ alignItems: "center", mb: 1, mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => {
                setPage(v);
              }}
              size="small"
              siblingCount={0}
              boundaryCount={1}
              sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
            />
          </Stack>
        </Box>
      );
    }

    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: t => alpha(t.palette.primary.main, 0.04),
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
                <TableCell sx={{ pl: 6 }}>{t("locationNameColumn")}</TableCell>
                <TableCell>{t("cityAndCountryColumn")}</TableCell>
                <TableCell>{t("coordinatesColumn")}</TableCell>
                <TableCell>{t("primaryColumn")}</TableCell>
                <TableCell align="right" sx={{ pr: 4 }}>
                  {tc("actions")}
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {locations.length > 0 ? (
                locations.map((loc: Location, i: number) => (
                  <TableRow
                    key={`${loc.id}-${String(i)}`}
                    hover
                    sx={{
                      transition: "background 0.15s",
                      "&:last-child td": { border: 0 },
                      "&:hover": {
                        bgcolor: t => alpha(t.palette.primary.main, 0.03),
                      },
                    }}
                  >
                    <TableCell sx={{ py: { xs: 1.2, sm: 1.8 } }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            width: { xs: 40, sm: 52 },
                            height: { xs: 40, sm: 52 },
                            borderRadius: 2,
                            overflow: "hidden",
                            flexShrink: 0,
                            bgcolor: t => alpha(t.palette.primary.main, 0.08),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {loc.imageUrl ? (
                            <Box
                              component="img"
                              src={toImageUrl(loc.imageUrl)}
                              alt={loc.name}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <LocationIcon color="primary" sx={{ fontSize: "small" }} />
                          )}
                        </Box>
                        <Box>
                          <Link href={`/admin/locations/${loc.id}/edit`} style={{ textDecoration: "none" }}>
                            <Typography
                              sx={{
                                fontSize: { xs: 13, sm: 15 },
                                fontWeight: 700,
                                color: "primary.main",
                                display: "inline",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {loc.name}
                            </Typography>
                          </Link>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {loc.addressLine}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {loc.city}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {loc.country}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {loc.latitude}, {loc.longitude}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {loc.isPrimary ? (
                        <Chip
                          size="small"
                          label={t("primary")}
                          color="primary"
                          sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <ActionButtons
                        locationId={loc.id}
                        onDelete={handleDelete}
                        onNavigate={handleNavigate}
                        viewOnSearchLabel={t("viewOnSearch")}
                        editLabel={tc("edit")}
                        deleteLabel={tc("delete")}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Box sx={{ textAlign: "center", opacity: 0.6 }}>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          mx: "auto",
                          mb: 2,
                          bgcolor: t => alpha(t.palette.text.disabled, 0.1),
                        }}
                      >
                        <SearchIcon sx={{ fontSize: 32, color: "text.disabled" }} />
                      </Avatar>
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t("noLocationsFound")}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="caption">{t("showingCount", { count: locations.length })}</Typography>
                </TableCell>
                <TableCell colSpan={2} align="right">
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, v) => {
                      setPage(v);
                    }}
                    size="small"
                    sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      <Stack
        direction={{ xs: "row", sm: "row" }}
        sx={{
          mb: { xs: 3, sm: 4 },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: { xs: "space-between" },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.6rem", md: "2rem" },
              fontWeight: 800,
            }}
          >
            {t("pageTitle")}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ paddingInlineStart: { xs: 0.6, sm: 1.2 } }}>
            {t("pageSubtitle")}
          </Typography>
        </Box>

        <Box
          onClick={() => {
            router.push("/admin/locations/create");
          }}
          sx={{
            px: 2.5,
            py: 1.2,
            borderRadius: 2,
            fontWeight: 700,
            color: "primary.contrastText",
            cursor: "pointer",
            background: t => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
            boxShadow: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
            transition: "0.2s",
            whiteSpace: "nowrap",
            alignSelf: { xs: "stretch", sm: "auto" },
            justifyContent: { xs: "center", sm: "flex-start" },
            "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
          }}
        >
          <AddIcon sx={{ fontSize: "small" }} />
          {t("addNewLocation")}
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label={t("totalLocations")}
            value={locations.length}
            color={theme.palette.primary.main}
            icon={<MapIcon />}
          />
        </Grid>
      </Grid>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
          }}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "background.paper",
            },
          }}
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

      {renderLocations()}

      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 2, p: 1, mx: { xs: 2, sm: "auto" } } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("deleteTitle")}</DialogTitle>
        <DialogContent>
          {t("deleteConfirmation")}
          <br />
          <strong>{t("deleteCannotBeUndone")}</strong>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, pb: 2, px: 2 }}>
          <Button onClick={handleCloseDelete} variant="outlined" sx={{ borderRadius: 2, flex: { xs: 1, sm: "none" } }}>
            {tc("cancel")}
          </Button>
          <Button
            onClick={(e: SyntheticEvent) => {
              e.preventDefault();
              void confirmDelete();
            }}
            color="error"
            variant="contained"
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              flex: { xs: 1, sm: "none" },
            }}
          >
            {tc("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          maxWidth: { xs: "calc(100% - 32px)", sm: "auto" },
          left: { xs: 16, sm: "auto" },
        }}
      >
        <Alert severity="error" onClose={handleCloseError}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

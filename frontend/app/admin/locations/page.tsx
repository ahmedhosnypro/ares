"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  InputAdornment,
  Card,
  Pagination,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import {
  EditRounded as EditIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  LocationOnTwoTone as LocationIcon,
  SearchRounded as SearchIcon,
  MapTwoTone as MapIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocations, deleteLocation } from "@/app/api/locations/locations";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

// ── STAT CARD ──
const StatCard = React.memo(function StatCard({ label, value, color, icon }: any) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(color, 0.08)} 100%)`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: (theme) => `0 8px 24px ${alpha(color, 0.18)}`,
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
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar sx={{ bgcolor: alpha(color, 0.15), color, width: 40, height: 40 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={700} lineHeight={1.2}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1.1, fontSize: { xs: "1.6rem", sm: "2.125rem" } }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
});

// ── ACTION BUTTONS ──
const ActionButtons = React.memo(function ActionButtons({
  locationId,
  onDelete,
  onNavigate,
}: {
  locationId: string;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          onClick={() => onNavigate(`/admin/locations/${locationId}/edit`)}
          sx={{ borderRadius: 2 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete">
        <IconButton
          onClick={() => onDelete(locationId)}
          size="small"
          sx={{
            borderRadius: 2,
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
              color: "error.main",
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
});

// ── MOBILE CARD ──
const LocationMobileCard = React.memo(function LocationMobileCard({
  loc,
  theme,
  onDelete,
  onNavigate,
}: {
  loc: any;
  theme: any;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "background 0.15s",
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
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
            <img
              src={loc.imageUrl.startsWith("http") ? loc.imageUrl : `http://localhost:5000/${loc.imageUrl}`}
              alt={loc.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <LocationIcon fontSize="small" color="primary" />
          )}
        </Box>

        <Box flex={1} minWidth={0}>
          <Typography fontWeight={700} fontSize={15} noWrap>
            {loc.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {loc.addressLine}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} mb={2}>
        <Chip size="small" label={loc.city} variant="outlined" />
        <Chip size="small" label={loc.country} variant="outlined" />
        {loc.isPrimary && (
          <Chip size="small" label="Primary" color="primary" sx={{ fontWeight: 600 }} />
        )}
      </Stack>

      <ActionButtons
        locationId={loc._id}
        onDelete={onDelete}
        onNavigate={onNavigate}
      />
    </Paper>
  );
});

// ── MAIN PAGE ──
export default function AdminLocationsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { locations, loading, page, totalPages, setPage, search, setSearch, setLocations } = useLocations(
    session?.accessToken
  );

  // ── HANDLERS ──
  const handleDelete = useCallback((id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      if (!session?.accessToken) return;
      await deleteLocation(session.accessToken, deleteId);
      
      setLocations(prev => prev.filter(loc => loc._id !== deleteId));
      setOpenDelete(false);
      setDeleteId(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete location");
      console.error(err);
    }
  }, [deleteId, session?.accessToken]);

  const handleCloseDelete = useCallback(() => setOpenDelete(false), []);
  const handleCloseError = useCallback(() => setErrorMsg(null), []);
  const handleNavigate = useCallback((path: string) => router.push(path), [router]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        mb={4}
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.5rem", sm: "1.6rem", md: "2rem" } }}>
            Locations Management
          </Typography>
          <Typography color="text.secondary" variant="body2">Manage pick-up and drop-off locations</Typography>
        </Box>

        <Box
          onClick={() => router.push("/admin/locations/create")}
          sx={{
            px: 2.5,
            py: 1.2,
            borderRadius: 3,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
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
          <AddIcon fontSize="small" />
          Add New Location
        </Box>
      </Stack>

      {/* STATS */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Total Locations"
            value={locations?.length || 0}
            color={theme.palette.primary.main}
            icon={<MapIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      {/* FILTER */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          fullWidth
          placeholder="Search by city, name, or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "background.paper" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {/* TABLE / MOBILE CARDS */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        /* ── MOBILE: card list ── */
        <Box>
          {locations.length > 0 ? (
            locations.map((loc: any) => (
              <LocationMobileCard
                key={loc._id}
                loc={loc}
                theme={theme}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
              />
            ))
          ) : (
            <Box py={8} textAlign="center" sx={{ opacity: 0.6 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor: (theme) => alpha(theme.palette.text.disabled, 0.1),
                }}
              >
                <SearchIcon sx={{ fontSize: 32, color: "text.disabled" }} />
              </Avatar>
              <Typography variant="h6" fontWeight={700} color="text.secondary">
                No locations found
              </Typography>
            </Box>
          )}

          {/* PAGINATION mobile */}
          <Stack direction="column" alignItems="center" spacing={1} mt={2} mb={1}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              size="small"
              siblingCount={0}
              boundaryCount={1}
              sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
            />
          </Stack>
        </Box>
      ) : (
        /* ── DESKTOP: table ── */
        <Paper
          elevation={0}
          sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
        >
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
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
                  <TableCell sx={{ pl: 6 }}>Location Name</TableCell>
                  <TableCell>City & Country</TableCell>
                  <TableCell>Coordinates</TableCell>
                  <TableCell>Primary</TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {locations.length > 0 ? (
                  locations.map((loc: any) => {
                    return (
                      <TableRow
                        key={loc._id}
                        hover
                        sx={{
                          transition: "background 0.15s",
                          "&:last-child td": { border: 0 },
                          "&:hover": {
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                          },
                        }}
                      >
                        <TableCell sx={{ py: { xs: 1.2, sm: 1.8 } }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: { xs: 40, sm: 52 },
                                height: { xs: 40, sm: 52 },
                                borderRadius: 2,
                                overflow: "hidden",
                                flexShrink: 0,
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {loc.imageUrl ? (
                                <img
                                  src={
                                    loc.imageUrl.startsWith("http")
                                      ? loc.imageUrl
                                      : `http://localhost:5000/${loc.imageUrl}`
                                  }
                                  alt={loc.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <LocationIcon fontSize="small" color="primary" />
                              )}
                            </Box>
                            <Box>
                              <Typography fontWeight={700} fontSize={{ xs: 13, sm: 15 }}>
                                {loc.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {loc.addressLine}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={600} variant="body2">
                            {loc.city}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {loc.country}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {loc.latitude}, {loc.longitude}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {loc.isPrimary ? (
                            <Chip size="small" label="Primary" color="primary" sx={{ fontWeight: 600, borderRadius: 2 }} />
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <ActionButtons
                            locationId={loc._id}
                            onDelete={handleDelete}
                            onNavigate={handleNavigate}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
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
                            bgcolor: (theme) => alpha(theme.palette.text.disabled, 0.1),
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 32, color: "text.disabled" }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight={700} color="text.secondary">
                          No locations found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="flex-end"
            alignItems="center"
            gap={1}
            p={2}
            sx={{ borderTop: "1px solid", borderColor: "divider" }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              size="small"
              sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
            />
          </Stack>
        </Paper>
      )}

      {/* DELETE DIALOG */}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, p: 1, mx: { xs: 2, sm: "auto" } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Location</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this location?
          <br />
          <strong>This action cannot be undone.</strong>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, pb: 2, px: 2 }}>
          <Button onClick={handleCloseDelete} variant="outlined" sx={{ borderRadius: 2, flex: { xs: 1, sm: "none" } }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, fontWeight: 700, flex: { xs: 1, sm: "none" } }}>
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
        sx={{ maxWidth: { xs: "calc(100% - 32px)", sm: "auto" }, left: { xs: 16, sm: "auto" } }}
      >
        <Alert severity="error" onClose={handleCloseError}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

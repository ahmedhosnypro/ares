"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  CircularProgress,
  Button,
  alpha,
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/utils/api-client";
import { getCategories, deleteCategory, Category } from "@/api-clients/categories/categories";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CategoryForm from "./_components/CategoryForm";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.categories");
  const tc = useTranslations("common");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch {
      setError(t("alerts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (session?.accessToken) {
      void fetchCategories();
    }
  }, [session, fetchCategories]);

  const handleDelete = async (id: string, vehicleCount: number) => {
    if (vehicleCount > 0) {
      setSnackbar({ open: true, message: t("alerts.deleteHasVehiclesError"), severity: "error" });
      return;
    }

    if (!window.confirm(t("actions.deleteConfirm"))) return;

    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setSnackbar({ open: true, message: t("alerts.deleteSuccess"), severity: "success" });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof ApiError ? err.message : t("alerts.deleteError"),
        severity: "error",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    void fetchCategories();
    setSnackbar({ open: true, message: t("alerts.saveSuccess"), severity: "success" });
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {t("title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          {t("addCategory")}
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Alert severity="error">{error}</Alert>
            <Button
              onClick={() => {
                void fetchCategories();
              }}
              sx={{ mt: 2 }}
            >
              {tc("retry")}
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme => alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell>{t("table.headers.name")}</TableCell>
                  <TableCell>{t("table.headers.commission")}</TableCell>
                  <TableCell>{t("table.headers.vehicles")}</TableCell>
                  <TableCell>{t("table.headers.offer")}</TableCell>
                  <TableCell>{t("table.headers.status")}</TableCell>
                  <TableCell align="right">{t("table.headers.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map(c => (
                    <TableRow
                      key={c.id}
                      hover
                      onClick={() => {
                        router.push(`/admin/categories/${c.id}`);
                      }}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                          <Avatar
                            sx={{ bgcolor: theme => alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}
                          >
                            <CategoryIcon />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                            {c.description && (
                              <Typography variant="caption" color="text.secondary">
                                {c.description.length > 50 ? `${c.description.substring(0, 50)}...` : c.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{c.commissionPercentage}%</TableCell>
                      <TableCell>{c.vehicleCount || 0}</TableCell>
                      <TableCell>
                        {c.activeOffer ? (
                          <Chip
                            label={t("table.offerValue", { discount: c.activeOffer.discountPercentage })}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {t("table.offerNone")}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.isActive ? t("table.statusActive") : t("table.statusInactive")}
                          size="small"
                          sx={{
                            bgcolor: theme =>
                              alpha(c.isActive ? theme.palette.success.main : theme.palette.text.disabled, 0.15),
                            color: c.isActive ? "success.main" : "text.secondary",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                          <Tooltip title={t("actions.edit")}>
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleEdit(c);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              c.vehicleCount && c.vehicleCount > 0
                                ? t("alerts.deleteHasVehiclesError")
                                : t("actions.delete")
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                disabled={!!(c.vehicleCount && c.vehicleCount > 0)}
                                onClick={e => {
                                  e.stopPropagation();
                                  void handleDelete(c.id, c.vehicleCount || 0);
                                }}
                                sx={{ color: "error.main" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">{t("table.empty")}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {formOpen && (
        <CategoryForm
          open={formOpen}
          category={editingCategory}
          onClose={() => {
            setFormOpen(false);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => {
          setSnackbar({ ...snackbar, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

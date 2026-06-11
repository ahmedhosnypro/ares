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
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getCategories, deleteCategory, Category } from "@/api-clients/categories/categories";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CategoryForm from "./_components/CategoryForm";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { data: session } = useSession();

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
    } catch (err) {
      setError("Failed to load categories. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.accessToken) {
      fetchCategories();
    }
  }, [session, fetchCategories]);

  const handleDelete = async (id: string, vehicleCount: number) => {
    if (vehicleCount > 0) {
      setSnackbar({ open: true, message: "Cannot delete a category that contains vehicles.", severity: "error" });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setSnackbar({ open: true, message: "Category deleted successfully.", severity: "success" });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.message || "Failed to delete category.", severity: "error" });
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
    fetchCategories();
    setSnackbar({ open: true, message: "Category saved successfully.", severity: "success" });
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Add Category
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
            <Button onClick={fetchCategories} sx={{ mt: 2 }}>Retry</Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: t => alpha(t.palette.primary.main, 0.04) }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Commission</TableCell>
                  <TableCell>Vehicles</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map(c => (
                    <TableRow key={c.id} hover onClick={() => router.push(`/admin/categories/${c.id}`)} sx={{ cursor: "pointer" }}>
                      <TableCell>
                        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                          <Avatar sx={{ bgcolor: t => alpha(t.palette.primary.main, 0.1), color: "primary.main" }}>
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
                        <Chip
                          label={c.isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            bgcolor: t => alpha(c.isActive ? t.palette.success.main : t.palette.text.disabled, 0.15),
                            color: c.isActive ? "success.main" : "text.secondary",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={c.vehicleCount && c.vehicleCount > 0 ? "Cannot delete category with vehicles" : "Delete"}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!!(c.vehicleCount && c.vehicleCount > 0)}
                                onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.vehicleCount || 0); }}
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
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No categories found.</Typography>
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
          onClose={() => setFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

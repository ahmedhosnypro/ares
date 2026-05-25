"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  TextField,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface AboutSection {
  id: string;
  title: string;
  content: string;
  order: number;
  sectionType: string;
  updatedAt: string;
}

interface FormState {
  title: string;
  content: string;
  order: number;
  sectionType: string;
}

const SECTION_TYPES = ["hero", "story", "offer", "stats", "values", "cta"];
const emptyForm: FormState = { title: "", content: "", order: 0, sectionType: "story" };

export default function AboutSettingsTab() {
  const { data: session } = useSession();

  const [sections, setSections] = useState<AboutSection[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const authHeader = { Authorization: `Bearer ${session?.accessToken ?? ""}` };

  const fetchSections = async () => {
    try {
      const res = await axios.get<AboutSection[]>(toApiUrl("/api/about"));
      setSections(res.data);
    } catch (err) {
      logger.error("Failed to fetch about sections", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void fetchSections();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, order: sections.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (section: AboutSection) => {
    setEditingId(section.id);
    setForm({ title: section.title, content: section.content, order: section.order, sectionType: section.sectionType });
    setDialogOpen(true);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "order" ? Number(value) : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await axios.put<AboutSection>(toApiUrl(`/api/about/${editingId}`), form, { headers: authHeader });
        setSections(prev => prev.map(s => (s.id === editingId ? res.data : s)));
      } else {
        const res = await axios.post<AboutSection>(toApiUrl("/api/about"), form, { headers: authHeader });
        setSections(prev => [...prev, res.data]);
      }
      setSuccessMsg(editingId ? "Section updated." : "Section created.");
      setDialogOpen(false);
    } catch (err) {
      logger.error("Failed to save about section", err);
      setErrorMsg("Failed to save section.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await axios.delete(toApiUrl(`/api/about/${id}`), { headers: authHeader });
      setSections(prev => prev.filter(s => s.id !== id));
      setSuccessMsg("Section deleted.");
    } catch (err) {
      logger.error("Failed to delete about section", err);
      setErrorMsg("Failed to delete section.");
    } finally {
      setDeleting(null);
      setDeleteConfirmId(null);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <>
      <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            About Page Sections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the sections displayed on the public About page.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreate}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Add Section
        </Button>
      </Stack>

      <Stack sx={{ gap: 2 }}>
        {sortedSections.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
            No about sections yet. Click &quot;Add Section&quot; to create one.
          </Typography>
        )}
        {sortedSections.map(section => (
          <Card
            key={section.id}
            sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "none" }}
          >
            <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    #{section.order}
                  </Typography>
                  <Chip label={section.sectionType} size="small" color="primary" variant="outlined" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {section.title}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-wrap", overflow: "hidden", maxHeight: 60, textOverflow: "ellipsis" }}
                >
                  {section.content}
                </Typography>
              </Box>
              <Stack sx={{ flexDirection: "row", gap: 0.5, flexShrink: 0 }}>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => {
                      openEdit(section);
                    }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleteConfirmId(section.id);
                    }}
                  >
                    {deleting === section.id ? <CircularProgress size={16} /> : <DeleteRoundedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? "Edit Section" : "New Section"}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            <TextField label="Title" name="title" value={form.title} onChange={handleFormChange} fullWidth required />
            <TextField
              label="Content"
              name="content"
              value={form.content}
              onChange={handleFormChange}
              fullWidth
              required
              multiline
              minRows={4}
            />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Section Type</InputLabel>
                <Select
                  label="Section Type"
                  name="sectionType"
                  value={form.sectionType}
                  onChange={e => {
                    setForm(prev => ({ ...prev, sectionType: e.target.value }));
                  }}
                >
                  {SECTION_TYPES.map(t => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Order"
                name="order"
                type="number"
                value={form.order}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving || !form.title || !form.content}
            sx={{ fontWeight: 700 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onClose={() => {
          setDeleteConfirmId(null);
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Section?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteConfirmId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteConfirmId) void handleDelete(deleteConfirmId);
            }}
            disabled={!!deleting}
            sx={{ fontWeight: 700 }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => {
          setErrorMsg(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="error"
          onClose={() => {
            setErrorMsg(null);
          }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => {
          setSuccessMsg(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          onClose={() => {
            setSuccessMsg(null);
          }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

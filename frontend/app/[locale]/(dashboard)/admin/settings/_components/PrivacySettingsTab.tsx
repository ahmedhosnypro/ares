"use client";

import { useState, useEffect, type ChangeEvent, useCallback, useMemo } from "react";
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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface SectionLocalization {
  title: string;
  content: string;
}

interface LocalizationsMap {
  ar: SectionLocalization;
}

interface PrivacySection {
  id: string;
  title: string;
  content: string;
  order: number;
  updatedAt: string;
  localizations: LocalizationsMap;
}

interface FormState {
  title: string;
  content: string;
  order: number;
  localizations: LocalizationsMap;
}

const SUPPORTED_LOCALES = ["en", "ar"] as const;
type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: "English (Default)",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
};

const emptyLocalization: SectionLocalization = { title: "", content: "" };
const defaultLocalizations: LocalizationsMap = { ar: { ...emptyLocalization } };
const emptyForm: FormState = { title: "", content: "", order: 0, localizations: { ...defaultLocalizations } };

export default function PrivacySettingsTab() {
  const { data: session } = useSession();

  const [sections, setSections] = useState<PrivacySection[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<LocaleCode>("en");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session?.accessToken ?? ""}` }), [session?.accessToken]);
  const isDefaultLocale = selectedLocale === "en";

  const getLocaleTitle = (section: PrivacySection): string => {
    if (isDefaultLocale) return section.title;
    return section.localizations.ar.title || section.title;
  };

  const getLocaleContent = (section: PrivacySection): string => {
    if (isDefaultLocale) return section.content;
    return section.localizations.ar.content || section.content;
  };

  const fetchSections = useCallback(async () => {
    try {
      const res = await axios.get<PrivacySection[]>(toApiUrl("/api/privacy?includeLocalizations=true"), {
        headers: authHeader,
      });
      setSections(res.data);
    } catch (err) {
      logger.error("Failed to fetch privacy sections", err);
    } finally {
      setFetching(false);
    }
  }, [authHeader]);

  useEffect(() => {
    void fetchSections();
  }, [fetchSections]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, order: sections.length + 1, localizations: { ...defaultLocalizations } });
    setDialogOpen(true);
  };

  const openEdit = (section: PrivacySection) => {
    setEditingId(section.id);
    setForm({
      title: section.title,
      content: section.content,
      order: section.order,
      localizations: { ...section.localizations },
    });
    setDialogOpen(true);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "order" ? Number(value) : value }));
  };

  const handleLocaleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      localizations: {
        ...prev.localizations,
        ar: { ...prev.localizations.ar, [name]: value },
      },
    }));
  };

  const handleSave = async () => {
    if (!session?.accessToken) {
      setErrorMsg("You must be signed in to perform this action.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        order: form.order,
        localizations: form.localizations,
      };
      if (editingId) {
        const res = await axios.put<PrivacySection>(toApiUrl(`/api/privacy/${editingId}`), payload, {
          headers: authHeader,
        });
        setSections(prev => prev.map(s => (s.id === editingId ? res.data : s)));
      } else {
        const res = await axios.post<PrivacySection>(toApiUrl("/api/privacy"), payload, { headers: authHeader });
        setSections(prev => [...prev, res.data]);
      }
      setSuccessMsg(editingId ? "Section updated." : "Section created.");
      setDialogOpen(false);
    } catch (err) {
      logger.error("Failed to save privacy section", err);
      setErrorMsg("Failed to save section.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.accessToken) {
      setErrorMsg("You must be signed in to perform this action.");
      return;
    }
    setDeleting(id);
    try {
      await axios.delete(toApiUrl(`/api/privacy/${id}`), { headers: authHeader });
      setSections(prev => prev.filter(s => s.id !== id));
      setSuccessMsg("Section deleted.");
    } catch (err) {
      logger.error("Failed to delete privacy section", err);
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
            Privacy Policy Sections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the sections displayed on the public Privacy Policy page.
          </Typography>
        </Box>
        <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Configure Locale</InputLabel>
            <Select
              label="Configure Locale"
              value={selectedLocale}
              onChange={e => {
                const val = e.target.value;
                setSelectedLocale(val);
              }}
            >
              {SUPPORTED_LOCALES.map(loc => (
                <MenuItem key={loc} value={loc}>
                  {LOCALE_LABELS[loc]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openCreate}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Add Section
          </Button>
        </Stack>
      </Stack>

      <Stack sx={{ gap: 2 }}>
        {sortedSections.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
            No privacy sections yet. Click &quot;Add Section&quot; to create one.
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
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {getLocaleTitle(section)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                  {getLocaleContent(section)}
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
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? "Edit Section" : "New Section"} &mdash; {LOCALE_LABELS[selectedLocale]}
        </DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            {isDefaultLocale ? (
              <>
                <TextField
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
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
                <TextField
                  label="Order"
                  name="order"
                  type="number"
                  value={form.order}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </>
            ) : (
              <>
                <TextField
                  label="Title"
                  name="title"
                  value={form.localizations.ar.title}
                  onChange={handleLocaleFormChange}
                  fullWidth
                />
                <TextField
                  label="Content"
                  name="content"
                  value={form.localizations.ar.content}
                  onChange={handleLocaleFormChange}
                  fullWidth
                  multiline
                  minRows={4}
                />
              </>
            )}
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
            disabled={saving || (isDefaultLocale && (!form.title || !form.content))}
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

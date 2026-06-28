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
  Chip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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

interface AboutSection {
  id: string;
  title: string;
  content: string;
  order: number;
  sectionType: string;
  updatedAt: string;
  localizations: LocalizationsMap;
}

interface FormState {
  title: string;
  content: string;
  order: number;
  sectionType: string;
  localizations: LocalizationsMap;
}

const SECTION_TYPES = ["hero", "story", "offer", "stats", "values", "cta"];
const SUPPORTED_LOCALES = ["en", "ar"] as const;
type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

const emptyLocalization: SectionLocalization = { title: "", content: "" };
const defaultLocalizations: LocalizationsMap = { ar: { ...emptyLocalization } };
const emptyForm: FormState = {
  title: "",
  content: "",
  order: 0,
  sectionType: "story",
  localizations: { ...defaultLocalizations },
};

export default function AboutSettingsTab() {
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.settings");
  const tc = useTranslations("common");

  const [sections, setSections] = useState<AboutSection[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const selectedLocale = "en" as LocaleCode;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session?.accessToken ?? ""}` }), [session?.accessToken]);
  const isDefaultLocale = selectedLocale === "en";

  const getLocaleTitle = (section: AboutSection): string => {
    if (isDefaultLocale) return section.title;
    return section.localizations.ar.title || section.title;
  };

  const getLocaleContent = (section: AboutSection): string => {
    if (isDefaultLocale) return section.content;
    return section.localizations.ar.content || section.content;
  };

  const fetchSections = useCallback(async () => {
    try {
      const res = await axios.get<AboutSection[]>(toApiUrl("/api/about?includeLocalizations=true"));
      setSections(res.data);
    } catch (err) {
      logger.error("Failed to fetch about sections", err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    void fetchSections();
  }, [fetchSections]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, order: sections.length + 1, localizations: { ...defaultLocalizations } });
    setDialogOpen(true);
  };

  const openEdit = (section: AboutSection) => {
    setEditingId(section.id);
    setForm({
      title: section.title,
      content: section.content,
      order: section.order,
      sectionType: section.sectionType,
      localizations: { ...section.localizations },
    });
    setDialogOpen(true);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "order" ? Number(value) : value }));
  };

  const handleSave = async () => {
    if (!session?.accessToken) {
      setErrorMsg(t("about.unauthorized"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        order: form.order,
        sectionType: form.sectionType,
        localizations: form.localizations,
      };
      if (editingId) {
        const res = await axios.put<AboutSection>(toApiUrl(`/api/about/${editingId}`), payload, {
          headers: authHeader,
        });
        setSections(prev => prev.map(s => (s.id === editingId ? res.data : s)));
      } else {
        const res = await axios.post<AboutSection>(toApiUrl("/api/about?includeLocalizations=true"), payload, {
          headers: authHeader,
        });
        setSections(prev => [...prev, res.data]);
      }
      setSuccessMsg(editingId ? t("about.sectionUpdated") : t("about.sectionCreated"));
      setDialogOpen(false);
    } catch (err) {
      logger.error("Failed to save about section", err);
      setErrorMsg(t("about.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.accessToken) {
      setErrorMsg(t("about.unauthorized"));
      return;
    }
    setDeleting(id);
    try {
      await axios.delete(toApiUrl(`/api/about/${id}`), { headers: authHeader });
      setSections(prev => prev.filter(s => s.id !== id));
      setSuccessMsg(t("about.sectionDeleted"));
    } catch (err) {
      logger.error("Failed to delete about section", err);
      setErrorMsg(t("about.deleteError"));
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
            {t("about.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("about.subtitle")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreate}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {t("about.addSection")}
        </Button>
      </Stack>

      <Stack sx={{ gap: 2 }}>
        {sortedSections.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
            {t("about.noSections")}
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
                    {getLocaleTitle(section)}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-wrap", overflow: "hidden", maxHeight: 60, textOverflow: "ellipsis" }}
                >
                  {getLocaleContent(section)}
                </Typography>
              </Box>
              <Stack sx={{ flexDirection: "row", gap: 0.5, flexShrink: 0 }}>
                <Tooltip title={tc("edit")}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      openEdit(section);
                    }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={tc("delete")}>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? t("about.editSection") : t("about.newSection")}</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            <TextField
              label={t("about.titleLabel")}
              name="title"
              value={form.title}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <TextField
              label={t("about.contentLabel")}
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
                <InputLabel>{t("about.typeLabel")}</InputLabel>
                <Select
                  label={t("about.typeLabel")}
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
                label={t("about.orderLabel")}
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
            {tc("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving || (isDefaultLocale && (!form.title || !form.content))}
            sx={{ fontWeight: 700 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : tc("save")}
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
        <DialogTitle sx={{ fontWeight: 700 }}>{t("about.deleteTitle")}</DialogTitle>
        <DialogContent>
          <Typography>{t("about.deleteConfirmDesc")}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteConfirmId(null);
            }}
          >
            {tc("cancel")}
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
            {deleting ? <CircularProgress size={20} color="inherit" /> : tc("delete")}
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

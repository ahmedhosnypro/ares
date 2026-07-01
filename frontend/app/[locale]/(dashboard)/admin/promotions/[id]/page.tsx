"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  Paper,
  IconButton,
  alpha,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  ArrowBackRounded as BackIcon,
  CancelTwoTone as DeactivateIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDate, parseUtcDate } from "@/utils/dateTime";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import {
  getDiscountCodes,
  updateDiscountCode,
  deleteDiscountCode,
  getDiscountAnalytics,
  type DiscountCodeResponse,
  type DiscountCodeCreateRequest,
  type DiscountCodeUpdateRequest,
  type DiscountAnalyticsResponse,
} from "@/api-clients/promotions/promotions";
import { formatCurrency } from "@/utils/currency-helpers";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import DiscountCodeForm from "../_components/DiscountCodeForm";
import DiscountAnalyticsView from "../_components/DiscountAnalyticsView";

function getDiscountStatus(discount: DiscountCodeResponse): "active" | "expired" | "inactive" {
  if (!discount.isActive) return "inactive";
  const now = new Date();
  const validTo = parseUtcDate(discount.validTo);
  if (validTo < now) return "expired";
  return "active";
}

export default function PromotionDetailPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const discountId = resolvedParams.id;
  const router = useRouter();
  const { data: session } = useSession();
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.promotions");
  const locale = useLocale();

  const [discount, setDiscount] = useState<DiscountCodeResponse | null>(null);
  const [analytics, setAnalytics] = useState<DiscountAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchDiscount = useCallback(async () => {
    try {
      setLoading(true);
      const token = session?.accessToken ?? "";
      const res = await getDiscountCodes({ page: 1, pageSize: 100 }, token);
      const found = res.data.find(d => d.discountId === discountId);
      if (found) {
        setDiscount(found);
      }
    } catch (err) {
      logger.error("Failed to fetch discount", err);
      setSnackbar({ open: true, message: "Failed to load discount", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [session, discountId]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = session?.accessToken ?? "";
      const data = await getDiscountAnalytics(discountId, undefined, undefined, token);
      setAnalytics(data);
    } catch (err) {
      logger.error("Failed to fetch analytics", err);
    }
  }, [session, discountId]);

  useEffect(() => {
    if (session?.accessToken && discountId) {
      void fetchDiscount();
      void fetchAnalytics();
    }
  }, [session, discountId, fetchDiscount, fetchAnalytics]);

  const handleUpdate = useCallback(
    async (data: DiscountCodeCreateRequest) => {
      try {
        setSaving(true);
        const token = session?.accessToken ?? "";
        const updateData: DiscountCodeUpdateRequest = { ...data };
        await updateDiscountCode(discountId, updateData, token);
        setEditMode(false);
        void fetchDiscount();
        setSnackbar({ open: true, message: "Discount updated", severity: "success" });
      } catch (err: unknown) {
        logger.error("Failed to update discount", err);
        setSnackbar({
          open: true,
          message: err instanceof ApiError ? err.message : "Failed to update discount",
          severity: "error",
        });
      } finally {
        setSaving(false);
      }
    },
    [session, discountId, fetchDiscount]
  );

  const handleDeactivate = useCallback(async () => {
    if (!discount) return;
    if (!window.confirm(t("deactivateConfirmMessage"))) return;
    try {
      const token = session?.accessToken ?? "";
      await updateDiscountCode(discountId, { isActive: !discount.isActive }, token);
      void fetchDiscount();
      setSnackbar({ open: true, message: "Discount status updated", severity: "success" });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof ApiError ? err.message : "Failed to update status",
        severity: "error",
      });
    }
  }, [session, discount, discountId, fetchDiscount, t]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(t("deleteConfirmMessage"))) return;
    try {
      const token = session?.accessToken ?? "";
      await deleteDiscountCode(discountId, true, token);
      router.push("/admin/promotions");
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof ApiError ? err.message : "Failed to delete discount",
        severity: "error",
      });
    }
  }, [session, discountId, router, t]);

  const getStatusChip = () => {
    if (!discount) return null;
    const status = getDiscountStatus(discount);
    if (status === "active") {
      return (
        <Chip
          label={t("statusActive")}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.status.active.main, 0.15),
            color: "status.active.main",
            fontWeight: 700,
          }}
        />
      );
    }
    if (status === "expired") {
      return (
        <Chip
          label={t("statusExpired")}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.text.disabled, 0.15),
            color: "text.secondary",
            fontWeight: 700,
          }}
        />
      );
    }
    return (
      <Chip
        label={t("statusInactive")}
        size="small"
        sx={{
          bgcolor: alpha(theme.palette.error.main, 0.15),
          color: "error.main",
          fontWeight: 700,
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!discount) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Discount not found
        </Typography>
        <Button
          onClick={() => {
            router.push("/admin/promotions");
          }}
          sx={{ mt: 2 }}
        >
          Back to Promotions
        </Button>
      </Box>
    );
  }

  const valueDisplay =
    discount.discountType === "percentage" ? `${discount.discountValue}%` : formatCurrency(discount.discountValue);

  if (editMode) {
    return (
      <Box sx={{ width: "100%", maxWidth: 780, mx: "auto", p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" sx={{ alignItems: "center", mb: 3 }}>
          <IconButton
            onClick={() => {
              setEditMode(false);
            }}
            sx={{ mr: 1 }}
          >
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t("editTitle")}
          </Typography>
          {saving && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Stack>
        <DiscountCodeForm
          initialData={discount}
          onSubmit={handleUpdate}
          onCancel={() => {
            setEditMode(false);
          }}
          loading={saving}
        />
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

  return (
    <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <IconButton
            onClick={() => {
              router.push("/admin/promotions");
            }}
          >
            <BackIcon />
          </IconButton>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "monospace" }}>
                {discount.code}
              </Typography>
              {getStatusChip()}
            </Stack>
            {discount.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {discount.description}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              setEditMode(true);
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeactivateIcon />}
            onClick={() => void handleDeactivate()}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              color: "warning.main",
              borderColor: "warning.main",
            }}
          >
            {discount.isActive ? t("deactivateBtn") : "Activate"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => void handleDelete()}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              color: "error.main",
              borderColor: "error.main",
            }}
          >
            {t("deleteBtn")}
          </Button>
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Details
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <DetailItem
            label={t("formType")}
            value={discount.discountType === "percentage" ? t("formTypePercentage") : t("formTypeFixed")}
          />
          <DetailItem label={t("formValue")} value={valueDisplay} />
          <DetailItem
            label={t("usageColumn")}
            value={
              discount.usageLimitTotal != null
                ? `${discount.currentUsageCount}/${discount.usageLimitTotal}`
                : `${discount.currentUsageCount}/\u221E`
            }
          />
          <DetailItem label={t("formValidFrom")} value={formatUtcDate(discount.validFrom, locale)} />
          <DetailItem label={t("formValidTo")} value={formatUtcDate(discount.validTo, locale)} />
          <DetailItem label={t("formUsageLimitPerCustomer")} value={String(discount.usageLimitPerCustomer)} />
          <DetailItem label={t("formCustomerSegments")} value={discount.customerSegments.join(", ") || "all"} />
          <DetailItem label={t("formPriority")} value={String(discount.priority)} />
          <DetailItem label={t("formAllowStacking")} value={discount.allowStacking ? "Yes" : "No"} />
          <DetailItem label={t("formIsAutomatic")} value={discount.isAutomatic ? "Yes" : "No"} />
          {discount.minimumDuration != null && (
            <DetailItem label={t("formMinimumDuration")} value={`${discount.minimumDuration} days`} />
          )}
          {discount.minimumValue != null && (
            <DetailItem label={t("formMinimumValue")} value={formatCurrency(discount.minimumValue)} />
          )}
        </Box>
      </Paper>

      {analytics && (
        <Box sx={{ mb: 3 }}>
          <DiscountAnalyticsView analytics={analytics} />
        </Box>
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

function DetailItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}

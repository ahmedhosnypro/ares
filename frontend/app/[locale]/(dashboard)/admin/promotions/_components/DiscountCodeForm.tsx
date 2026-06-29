"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Switch,
  Checkbox,
  FormGroup,
  InputAdornment,
  IconButton,
  CircularProgress,
  Autocomplete,
  Chip,
} from "@mui/material";
import { AutorenewRounded as AutoGenerateIcon } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useTranslations } from "next-intl";
import { logger } from "@/utils/logger";
import { fetchPublicCategories, type PublicCategory } from "@/utils/public-data";
import type { DiscountCodeCreateRequest, DiscountCodeResponse } from "@/api-clients/promotions/promotions";

interface DiscountCodeFormProps {
  readonly initialData?: Partial<DiscountCodeResponse>;
  readonly onSubmit: (data: DiscountCodeCreateRequest) => Promise<void>;
  readonly onCancel: () => void;
  readonly loading: boolean;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "PROMO-";
  for (let i = 0; i < 6; i++) {
    // eslint-disable-next-line sonarjs/pseudo-random
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function DiscountCodeForm({ initialData, onSubmit, onCancel, loading }: DiscountCodeFormProps) {
  const t = useTranslations("dashboardAdmin.promotions");

  const [code, setCode] = useState(initialData?.code ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(initialData?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = useState(String(initialData?.discountValue ?? ""));
  const [validFrom, setValidFrom] = useState<Date | null>(
    initialData?.validFrom ? new Date(initialData.validFrom) : null
  );
  const [validTo, setValidTo] = useState<Date | null>(initialData?.validTo ? new Date(initialData.validTo) : null);
  const [usageLimitTotal, setUsageLimitTotal] = useState(
    initialData?.usageLimitTotal != null ? String(initialData.usageLimitTotal) : ""
  );
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState(String(initialData?.usageLimitPerCustomer ?? 1));
  const [customerSegments, setCustomerSegments] = useState<string[]>(initialData?.customerSegments ?? ["all"]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialData?.vehicleCategoryIds ?? []);
  const [minimumDuration, setMinimumDuration] = useState(
    initialData?.minimumDuration != null ? String(initialData.minimumDuration) : ""
  );
  const [minimumValue, setMinimumValue] = useState(
    initialData?.minimumValue != null ? String(initialData.minimumValue) : ""
  );
  const [allowStacking, setAllowStacking] = useState(initialData?.allowStacking ?? false);
  const [isAutomatic, setIsAutomatic] = useState(initialData?.isAutomatic ?? false);
  const [priority, setPriority] = useState(String(initialData?.priority ?? 0));

  const [categories, setCategories] = useState<PublicCategory[]>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await fetchPublicCategories();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (mounted) {
          setCategories(data);
        }
      } catch (err) {
        logger.error("Failed to fetch categories", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAutomatic && !code) {
      setCode(generateCode());
    }
  }, [isAutomatic, code]);

  const handleSegmentToggle = (segment: string) => {
    if (segment === "all") {
      setCustomerSegments(["all"]);
      return;
    }
    setCustomerSegments(prev => {
      const withoutAll = prev.filter(s => s !== "all");
      if (withoutAll.includes(segment)) {
        return withoutAll.filter(s => s !== segment);
      }
      return [...withoutAll, segment];
    });
  };

  const segmentOptions = [
    { value: "all", label: t("formSegmentAll") },
    { value: "new", label: t("formSegmentNew") },
    { value: "returning", label: t("formSegmentReturning") },
  ];

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();

      const parsedValue = Number(discountValue);
      if (discountType === "percentage" && (parsedValue < 0 || parsedValue > 100)) return;
      if (discountType === "fixed" && parsedValue <= 0) return;

      const data: DiscountCodeCreateRequest = {
        code,
        description,
        discountType,
        discountValue: parsedValue,
        validFrom: validFrom ? validFrom.toISOString() : "",
        validTo: validTo ? validTo.toISOString() : "",
        usageLimitTotal: usageLimitTotal ? Number(usageLimitTotal) : null,
        usageLimitPerCustomer: Number(usageLimitPerCustomer),
        customerSegments,
        vehicleCategoryIds: selectedCategoryIds,
        minimumDuration: minimumDuration ? Number(minimumDuration) : null,
        minimumValue: minimumValue ? Number(minimumValue) : null,
        allowStacking,
        isAutomatic,
        priority: Number(priority),
      };

      await onSubmit(data);
    },
    [
      code,
      description,
      discountType,
      discountValue,
      validFrom,
      validTo,
      usageLimitTotal,
      usageLimitPerCustomer,
      customerSegments,
      selectedCategoryIds,
      minimumDuration,
      minimumValue,
      allowStacking,
      isAutomatic,
      priority,
      onSubmit,
    ]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        component="form"
        onSubmit={e => {
          void handleSubmit(e);
        }}
        sx={{ maxWidth: 720 }}
      >
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "flex-end" }}>
            <TextField
              label={t("formCode")}
              value={code}
              onChange={e => {
                setCode(e.target.value);
              }}
              disabled={isAutomatic}
              fullWidth
              slotProps={{
                input: {
                  sx: { fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 },
                },
              }}
              helperText={isAutomatic ? t("codeAutoGenerated") : undefined}
            />
            <IconButton
              onClick={() => {
                setCode(generateCode());
              }}
              disabled={isAutomatic}
              sx={{ mb: 0.5 }}
            >
              <AutoGenerateIcon />
            </IconButton>
          </Stack>

          <TextField
            label={t("formDescription")}
            value={description}
            onChange={e => {
              setDescription(e.target.value);
            }}
            multiline
            rows={3}
            fullWidth
          />

          <FormControl>
            <FormLabel sx={{ fontWeight: 700, mb: 0.5 }}>{t("formType")}</FormLabel>
            <RadioGroup
              row
              value={discountType}
              onChange={e => {
                setDiscountType(e.target.value as "percentage" | "fixed");
              }}
            >
              <FormControlLabel value="percentage" control={<Radio />} label={t("formTypePercentage")} />
              <FormControlLabel value="fixed" control={<Radio />} label={t("formTypeFixed")} />
            </RadioGroup>
          </FormControl>

          <TextField
            label={t("formValue")}
            value={discountValue}
            onChange={e => {
              setDiscountValue(e.target.value);
            }}
            type="number"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">{discountType === "percentage" ? "%" : "$"}</InputAdornment>
                ),
              },
            }}
            error={
              discountValue !== "" &&
              (discountType === "percentage"
                ? Number(discountValue) < 0 || Number(discountValue) > 100
                : Number(discountValue) <= 0)
            }
            helperText={discountType === "percentage" ? "0 - 100" : undefined}
          />

          <Stack direction="row" spacing={2}>
            <DatePicker
              label={t("formValidFrom")}
              value={validFrom}
              onChange={val => {
                setValidFrom(val);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  slotProps: { htmlInput: { autoComplete: "off" } },
                },
              }}
            />
            <DatePicker
              label={t("formValidTo")}
              value={validTo}
              onChange={val => {
                setValidTo(val);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  slotProps: { htmlInput: { autoComplete: "off" } },
                },
              }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label={t("formUsageLimitTotal")}
              value={usageLimitTotal}
              onChange={e => {
                setUsageLimitTotal(e.target.value);
              }}
              type="number"
              fullWidth
              helperText="Leave empty for unlimited"
            />
            <TextField
              label={t("formUsageLimitPerCustomer")}
              value={usageLimitPerCustomer}
              onChange={e => {
                setUsageLimitPerCustomer(e.target.value);
              }}
              type="number"
              fullWidth
            />
          </Stack>

          <FormControl sx={{ width: "100%" }}>
            <FormLabel sx={{ fontWeight: 700, mb: 0.5 }}>{t("formCustomerSegments")}</FormLabel>
            <FormGroup row sx={{ gap: 1 }}>
              {segmentOptions.map(opt => (
                <FormControlLabel
                  key={opt.value}
                  control={
                    <Checkbox
                      checked={customerSegments.includes(opt.value)}
                      onChange={() => {
                        handleSegmentToggle(opt.value);
                      }}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </FormGroup>
          </FormControl>

          <FormControl sx={{ width: "100%" }}>
            <FormLabel sx={{ fontWeight: 700, mb: 0.5 }}>{t("formVehicleCategories")}</FormLabel>
            <Autocomplete
              multiple
              options={categories}
              getOptionLabel={opt => opt.name}
              value={categories.filter(c => selectedCategoryIds.includes(c.id))}
              onChange={(_, newValue) => {
                setSelectedCategoryIds(newValue.map(c => c.id));
              }}
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  // eslint-disable-next-line sonarjs/no-unused-vars
                  const { key: _k, ...itemProps } = getItemProps({ index });
                  return <Chip key={option.id} label={option.name} {...itemProps} size="small" />;
                })
              }
              renderInput={params => <TextField {...params} placeholder="Select categories" />}
            />
          </FormControl>

          <Stack direction="row" spacing={2}>
            <TextField
              label={t("formMinimumDuration")}
              value={minimumDuration}
              onChange={e => {
                setMinimumDuration(e.target.value);
              }}
              type="number"
              fullWidth
              helperText="In days"
            />
            <TextField
              label={t("formMinimumValue")}
              value={minimumValue}
              onChange={e => {
                setMinimumValue(e.target.value);
              }}
              type="number"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
              }}
            />
          </Stack>

          <Stack direction="row" spacing={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={allowStacking}
                  onChange={e => {
                    setAllowStacking(e.target.checked);
                  }}
                />
              }
              label={t("formAllowStacking")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isAutomatic}
                  onChange={e => {
                    setIsAutomatic(e.target.checked);
                  }}
                />
              }
              label={t("formIsAutomatic")}
            />
          </Stack>

          <TextField
            label={t("formPriority")}
            value={priority}
            onChange={e => {
              setPriority(e.target.value);
            }}
            type="number"
            fullWidth
          />

          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", pt: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : "Save"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
}

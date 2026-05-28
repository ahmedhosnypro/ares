"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
  MenuItem,
  Alert,
  Divider,
} from "@mui/material";
import { z } from "zod";
import { passwordSchema, emailSchema } from "@/lib/validation/schemas";
import { createSupplier } from "@/api-clients/suppliers/suppliers"; // تأكد من المسار الصحيح

export default function CreateSupplierPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    status: "active",
    companyName: "",
    commercialRegistrationNumber: "",
    taxId: "",
  });

  const createSupplierSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .refine(v => /^[0-9+\s-]{8,15}$/.test(v), {
        message: "Invalid phone number",
      }),
    status: z.string(),
    companyName: z.string().min(1, "Company name is required"),
    commercialRegistrationNumber: z.string().min(1, "Commercial registration is required"),
    taxId: z.string().min(1, "Tax ID is required"),
  });

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const result = createSupplierSchema.safeParse(form);
      if (!result.success) {
        const simplifiedErrors: Record<string, string | undefined> = {};
        result.error.issues.forEach(issue => {
          const key = issue.path[0] as string;
          if (!simplifiedErrors[key]) {
            simplifiedErrors[key] = issue.message;
          }
        });
        setFieldErrors(simplifiedErrors);
        return;
      }

      await createSupplier({
        ...form,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });

      router.push("/admin/suppliers");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Create supplier failed";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 750, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Create New Supplier
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Register a new supplier with company details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={2.2}>
          {/* Account Info */}
          <Typography sx={{ fontWeight: 700 }} color="primary">
            Account Info
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Email"
              fullWidth
              value={form.email}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              onChange={e => {
                setForm({ ...form, email: e.target.value });
              }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={form.password}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              onChange={e => {
                setForm({ ...form, password: e.target.value });
              }}
            />
          </Stack>

          <Divider />

          {/* Personal Info */}
          <Typography sx={{ fontWeight: 700 }} color="primary">
            Representative Info
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="First Name"
              fullWidth
              value={form.firstName}
              error={Boolean(fieldErrors.firstName)}
              helperText={fieldErrors.firstName}
              onChange={e => {
                setForm({ ...form, firstName: e.target.value });
              }}
            />
            <TextField
              label="Last Name"
              fullWidth
              value={form.lastName}
              error={Boolean(fieldErrors.lastName)}
              helperText={fieldErrors.lastName}
              onChange={e => {
                setForm({ ...form, lastName: e.target.value });
              }}
            />
          </Stack>
          <TextField
            label="Phone Number"
            fullWidth
            value={form.phoneNumber}
            error={Boolean(fieldErrors.phoneNumber)}
            helperText={fieldErrors.phoneNumber}
            onChange={e => {
              setForm({ ...form, phoneNumber: e.target.value });
            }}
          />

          <Divider />

          {/* Company Info */}
          <Typography sx={{ fontWeight: 700 }} color="primary">
            Company Details
          </Typography>
          <TextField
            label="Company Name"
            fullWidth
            value={form.companyName}
            error={Boolean(fieldErrors.companyName)}
            helperText={fieldErrors.companyName}
            onChange={e => {
              setForm({ ...form, companyName: e.target.value });
            }}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Commercial Registration Number"
              fullWidth
              value={form.commercialRegistrationNumber}
              error={Boolean(fieldErrors.commercialRegistrationNumber)}
              helperText={fieldErrors.commercialRegistrationNumber}
              onChange={e => {
                setForm({ ...form, commercialRegistrationNumber: e.target.value });
              }}
            />
            <TextField
              label="Tax ID"
              fullWidth
              value={form.taxId}
              error={Boolean(fieldErrors.taxId)}
              helperText={fieldErrors.taxId}
              onChange={e => {
                setForm({ ...form, taxId: e.target.value });
              }}
            />
          </Stack>

          <TextField
            select
            label="Status"
            value={form.status}
            onChange={e => {
              setForm({ ...form, status: e.target.value });
            }}
            fullWidth
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="blocked">Blocked</MenuItem>
          </TextField>

          {/* Actions */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                router.back();
              }}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={() => void handleSubmit()}
              disabled={saving}
              sx={{ borderRadius: 2, px: 4, fontWeight: 600 }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : "Create Supplier"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

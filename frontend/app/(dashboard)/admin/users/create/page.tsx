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
import { createUser } from "@/api-clients/users/users";

export default function CreateUserPage() {
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
    role: "Supplier",
  });

  const createUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z
      .string()
      .optional()
      .refine(v => !v || /^[0-9+\s-]{8,15}$/.test(v), {
        message: "Invalid phone number",
      }),
    status: z.string(),
    role: z.string(),
  });

  // -------------------------
  // SUBMIT
  // -------------------------
  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const result = createUserSchema.safeParse(form);
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

      await createUser({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber,
        status: form.status,
        roles: [form.role],
      });

      router.push("/admin/users");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Create user failed";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 750, mx: "auto" }}>
      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Create User
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a new system user account
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
          borderColor: "border.light",
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={2.2}>
          {/* Account */}
          <Typography sx={{ fontWeight: 700 }} color="primary">
            Account Info
          </Typography>

          <TextField
            label="Email"
            value={form.email}
            onChange={e => {
              setForm({ ...form, email: e.target.value });
              if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
            }}
            fullWidth
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email}
          />

          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={e => {
              setForm({ ...form, password: e.target.value });
              if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
            }}
            fullWidth
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password}
          />

          <Divider />

          {/* Personal */}
          <Typography sx={{ fontWeight: 700 }} color="primary">
            Personal Info
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="First Name"
              value={form.firstName}
              onChange={e => {
                setForm({ ...form, firstName: e.target.value });
                if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: undefined }));
              }}
              fullWidth
              error={Boolean(fieldErrors.firstName)}
              helperText={fieldErrors.firstName}
            />

            <TextField
              label="Last Name"
              value={form.lastName}
              onChange={e => {
                setForm({ ...form, lastName: e.target.value });
                if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: undefined }));
              }}
              fullWidth
              error={Boolean(fieldErrors.lastName)}
              helperText={fieldErrors.lastName}
            />
          </Stack>

          <TextField
            label="Phone Number"
            value={form.phoneNumber}
            onChange={e => {
              setForm({ ...form, phoneNumber: e.target.value });
              if (fieldErrors.phoneNumber) setFieldErrors(prev => ({ ...prev, phoneNumber: undefined }));
            }}
            fullWidth
            error={Boolean(fieldErrors.phoneNumber)}
            helperText={fieldErrors.phoneNumber}
          />

          <Divider />

          {/* Role */}
          <Typography sx={{ fontWeight: 700 }} color="primary">
            Role
          </Typography>

          <TextField
            select
            label="User Role"
            value={form.role}
            onChange={e => {
              setForm({ ...form, role: e.target.value });
            }}
            fullWidth
          >
            <MenuItem value="Supplier">Supplier</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="User">User</MenuItem>
          </TextField>

          {/* Status */}
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
              onClick={() => {
                void handleSubmit();
              }}
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : "Create User"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/shared/i18n/routing";
import { Box, Typography, CircularProgress, Button } from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getSupplierById, type Supplier } from "@/api-clients/suppliers/suppliers";
import { logger } from "@/utils/logger";
import UserDetailsView from "../../_components/UserDetailsView";

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const supplierId = Array.isArray(params.supplierId) ? params.supplierId[0] : params.supplierId;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) return;
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const data = await getSupplierById(supplierId);
        setSupplier(data);
      } catch (err) {
        logger.error("Failed to load supplier", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchSupplier();
  }, [supplierId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          mt: 14,
        }}
      >
        <CircularProgress size={36} thickness={4} />
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>Loading supplier…</Typography>
      </Box>
    );
  }

  if (!supplier || !supplierId) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error" variant="h6" sx={{ mb: 2 }}>
          Supplier not found
        </Typography>
        <Button
          onClick={() => {
            router.back();
          }}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <UserDetailsView
      userType="supplier"
      data={supplier}
      onBack={() => {
        router.push("/admin/users?tab=suppliers");
      }}
      onEdit={() => {
        router.push(`/admin/suppliers/${supplierId}/edit`);
      }}
    />
  );
}

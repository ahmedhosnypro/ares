"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Box,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { format } from "date-fns";
import { toApiUrl } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import UserDetailsView from "../../_components/UserDetailsView";

interface ServiceAreaDto {
  readonly id: string;
  readonly name: string;
  readonly governorate: string;
  readonly isActive: boolean;
}

interface DriverDetails {
  readonly userId: string;
  readonly driverProfileId: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly phoneNumber?: string;
  readonly profilePictureUrl?: string;
  readonly licenseNumber?: string;
  readonly licenseExpiryDate?: string;
  readonly licenseImage?: string;
  readonly nationalIdFrontImage?: string;
  readonly nationalIdBackImage?: string;
  readonly address?: string;
  readonly emergencyContactName?: string;
  readonly emergencyContactPhone?: string;
  readonly status: string;
  readonly availability: string;
  readonly isActive: boolean;
  readonly rejectionReason?: string;
  readonly workAreas: readonly ServiceAreaDto[];
  readonly totalTrips: number;
  readonly averageRating: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export default function DriverDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [details, setDetails] = useState<DriverDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false,
    severity: "success",
    message: "",
  });

  const fetchDetails = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(toApiUrl(`/api/admin/drivers/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load driver details");
      const data = await res.json();
      setDetails(data);
    } catch (err) {
      logger.error("Error loading driver details", err);
      setError("Could not load driver details.");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    if (token) {
      void fetchDetails();
    }
  }, [token, fetchDetails]);

  const handleAction = async (action: "approve" | "reject" | "enable" | "disable", rejectionReason?: string) => {
    if (!token || !id) return;
    setActionBusy(true);
    try {
      const res = await fetch(toApiUrl(`/api/admin/drivers/${id}/${action}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(action === "reject" ? { "Content-Type": "application/json" } : {}),
        },
        body: action === "reject" ? JSON.stringify({ rejectionReason }) : undefined,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `Failed to ${action} driver`);
      }

      setToast({
        open: true,
        severity: "success",
        message: `Driver account successfully updated: ${action}`,
      });
      
      await fetchDetails();
    } catch (err) {
      logger.error(`Driver action ${action} failed`, err);
      setToast({
        open: true,
        severity: "error",
        message: err instanceof Error ? err.message : `Failed to ${action} driver`,
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleToggleActive = () => {
    if (!details) return;
    const action = details.isActive ? "disable" : "enable";
    void handleAction(action);
  };

  const handleApprove = () => {
    void handleAction("approve");
  };

  const handleReject = (reason: string) => {
    void handleAction("reject", reason);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !details) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
        <Alert severity="error">{error || "Driver not found"}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          onClick={() => {
            router.push("/admin/users?tab=drivers");
          }}
        >
          Back to Drivers
        </Button>
      </Box>
    );
  }

  const viewData = {
    id: details.userId,
    firstName: details.firstName || "",
    lastName: details.lastName || "",
    email: details.email || "",
    phoneNumber: details.phoneNumber,
    status: details.status,
    isActive: details.isActive,
    profilePictureUrl: details.profilePictureUrl ? toImageUrl(details.profilePictureUrl) : undefined,
    licenseNumber: details.licenseNumber,
    licenseExpiryDate: details.licenseExpiryDate ? format(new Date(details.licenseExpiryDate), "MMM d, yyyy") : undefined,
    licenseImage: details.licenseImage ? toImageUrl(details.licenseImage) : undefined,
    nationalIdFrontImage: details.nationalIdFrontImage ? toImageUrl(details.nationalIdFrontImage) : undefined,
    nationalIdBackImage: details.nationalIdBackImage ? toImageUrl(details.nationalIdBackImage) : undefined,
    address: details.address,
    emergencyContactName: details.emergencyContactName,
    emergencyContactPhone: details.emergencyContactPhone,
    rejectionReason: details.rejectionReason,
    workAreas: details.workAreas ? details.workAreas.map(w => ({ id: w.id, name: w.name, governorate: w.governorate, isActive: w.isActive })) : undefined,
    totalTrips: details.totalTrips,
    averageRating: details.averageRating,
    availability: details.availability,
  };

  return (
    <Box>
      <UserDetailsView
        userType="driver"
        data={viewData}
        onBack={() => {
          router.push("/admin/users?tab=drivers");
        }}
        onToggleStatus={handleToggleActive}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionBusy}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => {
          setToast((t) => ({ ...t, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

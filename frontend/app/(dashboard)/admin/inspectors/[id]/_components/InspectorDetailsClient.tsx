"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getInspectorDetails, updateInspectorStatus, type InspectorDetails } from "@/api-clients/inspectors/inspectors";
import { logger } from "@/utils/logger";
import UserDetailsView from "../../../_components/UserDetailsView";

interface Props {
  readonly inspectorId: string;
}

export default function InspectorDetailsClient({ inspectorId }: Props) {
  const router = useRouter();
  const [details, setDetails] = useState<InspectorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInspectorDetails(inspectorId);
      setDetails(data);
    } catch (err) {
      logger.error("Failed to load inspector details", err);
      setError("Failed to load inspector details.");
    } finally {
      setLoading(false);
    }
  }, [inspectorId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleToggle = () => {
    if (!details) return;
    void (async () => {
      setToggling(true);
      try {
        await updateInspectorStatus(details.inspector.inspectorId, {
          isActive: !details.inspector.isActive,
          isAvailable: !details.inspector.isActive ? true : null,
        });
        await fetchData();
      } catch (err) {
        logger.error("Toggle failed", err);
      } finally {
        setToggling(false);
      }
    })();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !details) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
        <Alert severity="error">{error || "Inspector not found"}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          onClick={() => {
            router.push("/admin/users?tab=inspectors");
          }}
        >
          Back to Inspectors
        </Button>
      </Box>
    );
  }

  const i = details.inspector;

  const viewData = {
    id: i.inspectorId,
    firstName: i.firstName,
    lastName: i.lastName,
    email: i.email,
    phoneNumber: i.phoneNumber,
    status: i.isActive ? "active" : "blocked",
    isActive: i.isActive,
    employeeCode: i.employeeCode,
    isAvailable: i.isAvailable,
    assignedCount: details.assignedCount,
    pendingCount: details.pendingCount,
    approvedCount: details.approvedCount,
    rejectedCount: details.rejectedCount,
    recentInspections: details.recentInspections,
  };

  return (
    <UserDetailsView
      userType="inspector"
      data={viewData}
      onBack={() => {
        router.push("/admin/users?tab=inspectors");
      }}
      onToggleStatus={handleToggle}
      actionLoading={toggling}
    />
  );
}

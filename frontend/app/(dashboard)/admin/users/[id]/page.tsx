"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";

import { getUserById, type User } from "@/api-clients/users/users";
import { logger } from "@/utils/logger";
import UserDetailsView from "../../_components/UserDetailsView";

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        setLoading(true);
        setIsMock(false);
        const data = await getUserById(id);
        setUser(data);
      } catch (err) {
        logger.error("Failed to load user from API, utilizing mock data", err);
        setIsMock(true);
        setUser({
          id: id || "mock-user-id",
          email: "alex.mercer@ares.nexus",
          firstName: "Alex",
          lastName: "Mercer",
          phoneNumber: "5550199222",
          dateOfBirth: "1994-08-23",
          status: "active",
          roles: ["Admin"],
          avatarUrl: "",
        } as any);
      } finally {
        setLoading(false);
      }
    };
    void fetchUser();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress size={36} thickness={3} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Loading user profile…
        </Typography>
      </Box>
    );
  }

  if (!user || !id) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>User not found.</Alert>
      </Box>
    );
  }

  return (
    <UserDetailsView
      userType="user"
      data={user}
      isMock={isMock}
      onBack={() => {
        router.push("/admin/users");
      }}
      onEdit={() => {
        router.push(`/admin/users/${id}/edit`);
      }}
    />
  );
}


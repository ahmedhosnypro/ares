"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import { toApiUrl } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";

interface ProfileHeaderProps {
  readonly userId: string;
  readonly accessToken: string;
  readonly photoUrl?: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly completeness: number;
  readonly isAdmin?: boolean;
}

export default function ProfileHeader({
  userId,
  accessToken,
  photoUrl,
  firstName,
  lastName,
  email,
  completeness,
  isAdmin = false,
}: ProfileHeaderProps) {
  const [currentPhoto, setCurrentPhoto] = useState(photoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(toApiUrl(`/api/users/${userId}/profile/photo`), {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = (await response.json()) as {
        profilePhotoUrl?: string;
        ProfilePhotoUrl?: string;
        photoUrl?: string;
      };

      const newPhotoUrl = data.profilePhotoUrl ?? data.ProfilePhotoUrl ?? data.photoUrl ?? URL.createObjectURL(file);

      setCurrentPhoto(newPhotoUrl);
      setSnackbar({
        open: true,
        message: "Profile picture updated successfully!",
        severity: "success",
      });
    } catch (error) {
      logger.error("Upload profile photo error", error);
      setSnackbar({
        open: true,
        message: "Failed to upload profile picture. Please try again.",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const safeName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "Valued Customer";
  const safeEmail = email || "No email provided";
  const progress = completeness;
  const initials = firstName ? firstName.charAt(0).toUpperCase() : "U";
  const resolvedPhoto = currentPhoto ? (toImageUrl(currentPhoto) ?? currentPhoto) : null;

  return (
    <Box
      sx={{
        p: 3,
        textAlign: "center",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: isAdmin ? "center" : "flex-start",
        width: "100%",
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center", pt: 2, width: "100%" }}>
        {/* Avatar with upload overlay */}
        <Box sx={{ position: "relative", display: "inline-block" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              void handleFileChange(e);
            }}
            style={{ display: "none" }}
            accept="image/png, image/jpeg, image/jpg, image/webp"
          />

          <Avatar
            sx={{
              width: 88,
              height: 88,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontSize: "2rem",
              fontWeight: 800,
              border: t => `3px solid ${t.palette.border.main}`,
              cursor: "pointer",
              overflow: "hidden",
              position: "relative",
            }}
            onClick={handleImageClick}
          >
            {resolvedPhoto ? (
              <Image src={resolvedPhoto} alt={safeName} fill sizes="88px" style={{ objectFit: "cover" }} />
            ) : (
              initials
            )}
          </Avatar>

          {/* Upload overlay */}
          <IconButton
            onClick={handleImageClick}
            size="small"
            aria-label="Change profile photo"
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              width: 28,
              height: 28,
              border: t => `2px solid ${t.palette.background.paper}`,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            {isUploading ? (
              <CircularProgress size={14} sx={{ color: "primary.contrastText" }} />
            ) : (
              <CameraAltRoundedIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Box>

        {/* Name & email */}
        <Box>
          <Typography variant="h6" sx={{ color: "text.primary", lineHeight: 1.2, fontWeight: 800 }}>
            {safeName}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {safeEmail}
          </Typography>
        </Box>
      </Stack>

      {/* Profile completeness */}
      {!isAdmin && (
        <Box sx={{ width: "100%", mt: "auto", pb: 1, textAlign: "left" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography
              variant="overline"
              sx={{
                fontSize: "0.75rem",
                letterSpacing: 1,
                fontWeight: 700,
                color: "text.secondary",
                lineHeight: 1,
              }}
            >
              Profile Completion
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: "primary.main",
              }}
            >
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color="primary"
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "border.light",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
              },
            }}
          />
        </Box>
      )}

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

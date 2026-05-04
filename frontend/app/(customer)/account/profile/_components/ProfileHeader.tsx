"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Avatar, Box, CircularProgress, IconButton, LinearProgress, Typography } from "@mui/material";
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
}

export default function ProfileHeader({
  userId,
  accessToken,
  photoUrl,
  firstName,
  lastName,
  email,
  completeness,
}: ProfileHeaderProps) {
  const [currentPhoto, setCurrentPhoto] = useState(photoUrl);
  const [isUploading, setIsUploading] = useState(false);
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
    } catch (error) {
      logger.error("Upload profile photo error", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const safeName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "Valued Customer";
  const safeEmail = email || "No email provided";
  const progress = completeness;
  const initials = firstName ? firstName.charAt(0).toUpperCase() : "U";
  const resolvedPhoto = currentPhoto ? (toImageUrl(currentPhoto) ?? currentPhoto) : null;

  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      {/* Avatar with upload overlay */}
      <Box sx={{ position: "relative", display: "inline-block", mb: 2 }}>
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
      <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
        {safeName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {safeEmail}
      </Typography>

      {/* Profile completeness */}
      <Box sx={{ textAlign: "left" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}
          >
            Profile Completion
          </Typography>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>
            {progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          color="primary"
          sx={{
            height: 6,
            borderRadius: 999,
            bgcolor: "border.light",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
            },
          }}
        />
      </Box>
    </Box>
  );
}

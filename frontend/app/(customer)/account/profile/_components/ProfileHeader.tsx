"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toApiUrl } from "@/src/utils/api-client";
import { toImageUrl } from "@/src/utils/image-url";
import { logger } from "@/src/utils/logger";

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

      if (!response.ok) {
        throw new Error("فشل في رفع الصورة للسيرفر");
      }

      const data = (await response.json()) as { profilePhotoUrl?: string; ProfilePhotoUrl?: string; photoUrl?: string };

      const newPhotoUrl = data.profilePhotoUrl || data.ProfilePhotoUrl || data.photoUrl || URL.createObjectURL(file);

      setCurrentPhoto(newPhotoUrl);
    } catch (error) {
      logger.error("Upload profile photo error", error);
      alert("حصلت مشكلة في رفع الصورة، جرب تاني.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const safeName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "Valued Customer";
  const safeEmail = email || "No email provided";
  const progress = completeness || 0;

  return (
    <div className="p-6 text-center">
      {/* الصورة الشخصية */}
      <div
        onClick={handleImageClick}
        className="group relative mx-auto mb-4 h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 border-indigo-50 bg-slate-100 transition-colors duration-300 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => {
            void handleFileChange(e);
          }}
          className="hidden"
          accept="image/png, image/jpeg, image/jpg, image/webp"
        />

        {isUploading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Camera className="h-8 w-8 text-white drop-shadow-md" />
        </div>

        {currentPhoto ? (
          <Image src={toImageUrl(currentPhoto) ?? currentPhoto} alt={safeName} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-2xl font-black text-indigo-600 transition-colors duration-300 dark:bg-indigo-500/20 dark:text-indigo-400">
            {firstName ? firstName.charAt(0).toUpperCase() : "U"}
          </div>
        )}
      </div>

      <h2 className="text-xl font-black text-slate-900 transition-colors duration-300 dark:text-white">{safeName}</h2>
      <p className="mb-6 text-sm font-medium text-slate-500 transition-colors duration-300 dark:text-slate-400">
        {safeEmail}
      </p>

      <div className="text-left">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors duration-300 dark:text-slate-400">
            Profile Completion
          </span>
          <span className="text-xs font-black text-indigo-600 transition-colors duration-300 dark:text-indigo-400">
            {progress}%
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 transition-colors duration-300 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${progress.toString()}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

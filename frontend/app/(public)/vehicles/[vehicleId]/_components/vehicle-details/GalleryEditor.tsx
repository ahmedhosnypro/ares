"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Box, ButtonBase, Stack, IconButton, Typography, Button, Tooltip } from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";
import { useFormContext, useFieldArray } from "react-hook-form";
import { toImageUrl } from "@/utils/image-url";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageFormItem {
  url: string;
  isPrimary: boolean;
  file?: File;
}

interface FormValues {
  images: ImageFormItem[];
}

export default function GalleryEditor() {
  const { control, watch, setValue } = useFormContext<FormValues>();
  const { append, remove } = useFieldArray({
    control,
    name: "images",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const images = watch("images");
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [fileError, setFileError] = useState<string | null>(null);

  const activeImage = images[activeIndex];

  const handleSetPrimary = (index: number) => {
    const updatedImages = images.map((img: ImageFormItem, i: number) => ({
      ...img,
      isPrimary: i === index,
    }));
    setValue("images", updatedImages, { shouldDirty: true });
  };

  const handleRemove = (index: number) => {
    // If it's a blob URL, we should revoke it to avoid memory leaks
    if (images[index]?.url.startsWith("blob:")) {
      URL.revokeObjectURL(images[index].url);
    }

    remove(index);
    if (activeIndex >= index && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size exceeds 10MB limit.");
      return;
    }

    setFileError(null);
    const tempUrl = URL.createObjectURL(file);

    append({
      url: tempUrl,
      isPrimary: images.length === 0,
      file: file,
    });

    setActiveIndex(images.length);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Stack spacing={2}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />

      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "action.hover",
        }}
      >
        {activeImage.url.startsWith("blob:") || toImageUrl(activeImage.url) ? (
          <Image
            src={activeImage.url.startsWith("blob:") ? activeImage.url : (toImageUrl(activeImage.url) as string)}
            alt="Vehicle"
            fill
            sizes="(max-width: 1200px) 100vw, 60vw"
            priority
            style={{ objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ display: "grid", placeItems: "center", height: "100%" }}>
            <Typography color="text.secondary">No image selected</Typography>
          </Box>
        )}

        {images[activeIndex] ? (
          <Box sx={{ position: "absolute", bottom: 16, right: 16, display: "flex", gap: 1 }}>
            <Tooltip title={images[activeIndex].isPrimary ? "Featured Image" : "Set as Featured"}>
              <IconButton
                onClick={() => {
                  handleSetPrimary(activeIndex);
                }}
                sx={{
                  bgcolor: images[activeIndex].isPrimary ? "primary.main" : "background.paper",
                  color: images[activeIndex].isPrimary ? "primary.contrastText" : "text.primary",
                  "&:hover": {
                    bgcolor: images[activeIndex].isPrimary ? "primary.dark" : "action.hover",
                  },
                  boxShadow: 2,
                }}
              >
                {images[activeIndex].isPrimary ? <StarRoundedIcon /> : <StarOutlineRoundedIcon />}
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={() => {
                handleRemove(activeIndex);
              }}
              sx={{ bgcolor: "error.main", color: "common.white", "&:hover": { bgcolor: "error.dark" } }}
            >
              <DeleteRoundedIcon />
            </IconButton>
          </Box>
        ) : null}
      </Box>

      <Box sx={{ display: "flex", gap: 1, overflowX: "auto", py: 0.5, alignItems: "center" }}>
        {images.map((img: ImageFormItem, index: number) => {
          const isActive = index === activeIndex;
          const url = img.url.startsWith("blob:") ? img.url : toImageUrl(img.url);
          return (
            <ButtonBase
              key={`${index}-${img.url}`}
              onClick={() => {
                setActiveIndex(index);
              }}
              sx={{
                position: "relative",
                width: 120,
                height: 76,
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: 1.5,
                border: "2px solid",
                borderColor: isActive ? "primary.main" : "transparent",
                bgcolor: "action.hover",
              }}
            >
              {url ? (
                <Image src={url} alt="Vehicle" fill sizes="120px" style={{ objectFit: "cover" }} />
              ) : (
                <Typography variant="caption">No Preview</Typography>
              )}
              {img.isPrimary ? (
                <Box
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "primary.main",
                    borderRadius: "50%",
                    p: 0.2,
                    display: "flex",
                  }}
                >
                  <StarRoundedIcon sx={{ fontSize: 12, color: "common.white" }} />
                </Box>
              ) : null}
            </ButtonBase>
          );
        })}

        <Button
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          onClick={handleAddClick}
          sx={{ minWidth: 120, height: 76, borderRadius: 1.5, borderStyle: "dashed" }}
        >
          Add
        </Button>
      </Box>

      {fileError && (
        <Typography variant="caption" color="error">
          {fileError}
        </Typography>
      )}
    </Stack>
  );
}

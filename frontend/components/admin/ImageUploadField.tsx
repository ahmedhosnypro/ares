"use client";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Box, Button, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { type ChangeEvent, useEffect, useRef } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface ImageUploadFieldProps {
	readonly imageFile: File | null;
	readonly imagePreview: string | null;
	readonly onImageChange: (file: File | null, preview: string | null) => void;
	readonly onError: (message: string) => void;
	readonly disabled?: boolean;
	readonly sectionTitle: string;
	readonly previewAlt: string;
	readonly changeImageLabel: string;
	readonly removeImageLabel: string;
	readonly clickToUploadLabel: string;
	readonly uploadFormatHintLabel: string;
	readonly invalidTypeMessage: string;
	readonly sizeExceedsMessage: string;
}

export default function ImageUploadField({
	imageFile: _imageFile,
	imagePreview,
	onImageChange,
	onError,
	disabled = false,
	sectionTitle,
	previewAlt,
	changeImageLabel,
	removeImageLabel,
	clickToUploadLabel,
	uploadFormatHintLabel,
	invalidTypeMessage,
	sizeExceedsMessage,
}: ImageUploadFieldProps) {
	const isBlobPreview = imagePreview?.startsWith("blob:");
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const currentPreview = imagePreview;
		return () => {
			if (currentPreview?.startsWith("blob:"))
				URL.revokeObjectURL(currentPreview);
		};
	}, [imagePreview]);

	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
			onError(invalidTypeMessage);
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			onError(sizeExceedsMessage);
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		onError("");
		if (isBlobPreview && imagePreview) URL.revokeObjectURL(imagePreview);
		const url = URL.createObjectURL(file);
		onImageChange(file, url);
	};

	const handleRemoveImage = () => {
		if (isBlobPreview && imagePreview) URL.revokeObjectURL(imagePreview);
		onImageChange(null, null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<>
			<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
				{sectionTitle}
			</Typography>

			<input
				ref={fileInputRef}
				type="file"
				accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
				style={{ display: "none" }}
				onChange={handleImageChange}
			/>

			{imagePreview ? (
				<Box>
					<Box
						sx={{
							position: "relative",
							width: "100%",
							height: 220,
							borderRadius: 2,
							overflow: "hidden",
							border: "1px solid",
							borderColor: "divider",
							mb: 1,
						}}
					>
						<Image
							src={imagePreview}
							alt={previewAlt}
							fill
							style={{ objectFit: "cover" }}
						/>
					</Box>
					<Stack direction="row" spacing={1}>
						<Button
							size="small"
							variant="outlined"
							disabled={disabled}
							onClick={() => {
								fileInputRef.current?.click();
							}}
						>
							{changeImageLabel}
						</Button>
						<Button
							size="small"
							variant="outlined"
							color="error"
							disabled={disabled}
							onClick={handleRemoveImage}
						>
							{removeImageLabel}
						</Button>
					</Stack>
				</Box>
			) : (
				<Box
					onClick={() => {
						if (!disabled) fileInputRef.current?.click();
					}}
					sx={{
						border: "2px dashed",
						borderColor: "divider",
						borderRadius: 2,
						p: 4,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 1,
						cursor: disabled ? "not-allowed" : "pointer",
						transition: "border-color 0.2s",
						"&:hover": {
							borderColor: disabled ? "divider" : "primary.main",
						},
					}}
				>
					<CloudUploadIcon sx={{ fontSize: 40, color: "text.secondary" }} />
					<Typography variant="body2" color="text.secondary">
						{clickToUploadLabel}
					</Typography>
					<Typography variant="caption" color="text.disabled">
						{uploadFormatHintLabel}
					</Typography>
				</Box>
			)}
		</>
	);
}

export type { ImageUploadFieldProps };
export { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE };

"use client";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import {
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Container,
	Divider,
	FormControlLabel,
	IconButton,
	InputAdornment,
	Stack,
	Switch,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	createCategory,
	uploadCategoryImage,
} from "@/api-clients/categories/categories";
import { Link, useRouter } from "@/shared/i18n/routing";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function CreateCategoryPage() {
	const t = useTranslations("dashboardAdmin.categories");
	const theme = useTheme();
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	useEffect(() => {
		return () => {
			if (imagePreview) URL.revokeObjectURL(imagePreview);
		};
	}, [imagePreview]);

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		commissionPercentage: 0,
		isActive: true,
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]:
				type === "checkbox"
					? checked
					: type === "number"
						? Number(value)
						: value,
		}));
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
			setError("Only PNG, JPG, and WEBP images are allowed.");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			setError("File size exceeds 10MB limit.");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		setError(null);
		if (imagePreview) URL.revokeObjectURL(imagePreview);
		setImageFile(file);
		const url = URL.createObjectURL(file);
		setImagePreview(url);
	};

	const handleRemoveImage = () => {
		setImageFile(null);
		if (imagePreview) URL.revokeObjectURL(imagePreview);
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			setError(t("form.validation.nameRequired"));
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const payload = {
				name: formData.name.trim(),
				description: formData.description.trim() || undefined,
				commissionPercentage: formData.commissionPercentage,
				isActive: formData.isActive,
			};

			const createdCategory = await createCategory(payload);

			if (imageFile) {
				try {
					await uploadCategoryImage(createdCategory.id, imageFile);
				} catch {
					router.push("/admin/categories");
					return;
				}
			}

			router.push("/admin/categories");
		} catch (err: unknown) {
			const errorResponse = err as {
				response?: { data?: { message?: string } };
			};
			setError(
				errorResponse.response?.data?.message || t("form.errors.saveFailed"),
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ pb: 6, minHeight: "100vh" }}>
			<Container maxWidth="md">
				<Stack direction="row" sx={{ alignItems: "center", mb: 4, mt: 3 }}>
					<Link href="/admin/categories" style={{ textDecoration: "none" }}>
						<IconButton
							sx={{
								bgcolor: "background.paper",
								boxShadow: 1,
								mr: theme.direction === "rtl" ? 0 : 2,
								ml: theme.direction === "rtl" ? 2 : 0,
								color: "text.primary",
								"&:hover": {
									bgcolor: "background.paper",
									transform:
										theme.direction === "rtl"
											? "translateX(3px)"
											: "translateX(-3px)",
								},
							}}
						>
							<ArrowBackIosNewIcon
								fontSize="small"
								sx={{
									transform:
										theme.direction === "rtl" ? "rotate(180deg)" : "none",
								}}
							/>
						</IconButton>
					</Link>
					<Typography
						variant="h5"
						sx={{ fontWeight: 700, color: "text.primary" }}
					>
						{t("form.addTitle")}
					</Typography>
				</Stack>

				<form
					onSubmit={(e) => {
						void handleSubmit(e);
					}}
				>
					<Card
						sx={{
							borderRadius: 3,
							boxShadow: theme.palette.shadow.card,
							bgcolor: "background.paper",
							border: `1px solid ${theme.palette.border.main}`,
							overflow: "hidden",
						}}
					>
						<Box
							sx={{
								height: 6,
								background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
							}}
						/>
						<CardContent sx={{ p: 4 }}>
							<Grid container spacing={3}>
								<Grid size={{ xs: 12 }}>
									<Typography
										variant="subtitle1"
										sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
									>
										{t("form.infoTitle")}
									</Typography>
									<Divider sx={{ mb: 2 }} />
								</Grid>

								<Grid size={{ xs: 12 }}>
									<TextField
										label={t("form.fields.name")}
										name="name"
										value={formData.name}
										onChange={handleChange}
										fullWidth
										required
										disabled={loading}
										placeholder={t("form.placeholders.name")}
										slotProps={{
											input: {
												sx: { borderRadius: 2 },
											},
										}}
									/>
								</Grid>

								<Grid size={{ xs: 12 }}>
									<TextField
										label={t("form.fields.description")}
										name="description"
										value={formData.description}
										onChange={handleChange}
										fullWidth
										multiline
										rows={3}
										disabled={loading}
										placeholder={t("form.placeholders.description")}
										slotProps={{
											input: {
												sx: { borderRadius: 2 },
											},
										}}
									/>
								</Grid>

								<Grid size={{ xs: 12, sm: 6 }}>
									<TextField
										label={t("form.fields.commission")}
										name="commissionPercentage"
										type="number"
										value={formData.commissionPercentage}
										onChange={handleChange}
										fullWidth
										disabled={loading}
										slotProps={{
											input: {
												endAdornment: (
													<InputAdornment position="end">%</InputAdornment>
												),
												sx: { borderRadius: 2 },
											},
											htmlInput: { min: 0, max: 100, step: "0.01" },
										}}
									/>
								</Grid>

								<Grid
									size={{ xs: 12, sm: 6 }}
									sx={{ display: "flex", alignItems: "center" }}
								>
									<FormControlLabel
										control={
											<Switch
												checked={formData.isActive}
												onChange={handleChange}
												name="isActive"
												disabled={loading}
												color="primary"
											/>
										}
										label={
											<Typography
												sx={{ fontWeight: 600, color: "text.primary" }}
											>
												{formData.isActive
													? t("form.statusActiveLabel")
													: t("form.statusInactiveLabel")}
											</Typography>
										}
									/>
								</Grid>

								<Grid size={{ xs: 12 }}>
									<Typography
										variant="subtitle2"
										sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
									>
										Category Image
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
													alt="Category preview"
													fill
													style={{ objectFit: "cover" }}
												/>
											</Box>
											<Stack direction="row" spacing={1}>
												<Button
													size="small"
													variant="outlined"
													disabled={loading}
													onClick={() => {
														fileInputRef.current?.click();
													}}
												>
													Change Image
												</Button>
												<Button
													size="small"
													variant="outlined"
													color="error"
													disabled={loading}
													onClick={handleRemoveImage}
												>
													Remove
												</Button>
											</Stack>
										</Box>
									) : (
										<Box
											onClick={() => {
												if (!loading) fileInputRef.current?.click();
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
												cursor: loading ? "not-allowed" : "pointer",
												transition: "border-color 0.2s",
												"&:hover": {
													borderColor: loading ? "divider" : "primary.main",
												},
											}}
										>
											<CloudUploadIcon
												sx={{ fontSize: 40, color: "text.secondary" }}
											/>
											<Typography variant="body2" color="text.secondary">
												Click to upload an image
											</Typography>
											<Typography variant="caption" color="text.disabled">
												PNG, JPG, WEBP up to 10 MB
											</Typography>
										</Box>
									)}
								</Grid>

								{error && (
									<Grid size={{ xs: 12 }}>
										<Typography
											color="error"
											variant="body2"
											sx={{ fontWeight: 600 }}
										>
											{error}
										</Typography>
									</Grid>
								)}

								<Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{ justifyContent: "flex-end" }}
									>
										<Link
											href="/admin/categories"
											passHref
											style={{ textDecoration: "none" }}
										>
											<Button
												variant="outlined"
												color="inherit"
												disabled={loading}
												sx={{
													borderRadius: 2,
													px: 3,
													py: 1,
													fontWeight: 600,
												}}
											>
												{t("form.cancelBtn")}
											</Button>
										</Link>
										<Button
											type="submit"
											variant="contained"
											color="primary"
											disabled={loading || !formData.name.trim()}
											startIcon={
												loading ? (
													<CircularProgress size={20} color="inherit" />
												) : (
													<SaveIcon />
												)
											}
											sx={{
												borderRadius: 2,
												px: 4,
												py: 1,
												fontWeight: 700,
												boxShadow: theme.palette.shadow.button,
												"&:hover": {
													boxShadow: theme.palette.shadow.buttonHover,
												},
											}}
										>
											{loading ? t("form.creatingBtn") : t("form.createBtn")}
										</Button>
									</Stack>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				</form>
			</Container>
		</Box>
	);
}

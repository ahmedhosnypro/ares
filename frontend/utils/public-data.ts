import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface PublicLocation {
  id: string;
  label: string;
  city: string;
  governorate: string;
  country: string;
  addressLine: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

export interface PublicVehicleCard {
  vehicleId: string;
  make: string;
  model: string;
  dailyRate: number;
  originalDailyRate?: number;
  discountPercentage?: number;
  currency: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  available: boolean;
  locationCity: string;
  status: string;
}

export interface PublicSupplierCard {
  id: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  status: string;
  commercialRegistrationNumber: string;
  createdAt: string;
}

export interface PublicLandingValueProp {
  title: string;
  description: string;
  accent: string;
}

export interface PublicFaqItem {
  question: string;
  answer: string;
}

export interface PublicLandingSupport {
  title: string;
  description: string;
  actionLabel: string;
}

export interface PublicLandingContent {
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
  valueProps: PublicLandingValueProp[];
  faqItems: PublicFaqItem[];
  support: PublicLandingSupport;
}

export interface PublicDestinationCard {
  id: string;
  city: string;
  country: string;
  imageUrl?: string;
  startingPrice: number;
  vehicleCount: number;
}

export interface PublicCategory {
  id: string;
  name: string;
  vehicleCount?: number;
}

interface ApiPagedResponse<T> {
  data?: T[];
  resultData?: T[];
  items?: T[];
}

type ApiValue = number | string | null;

interface ApiLocationDto {
  id?: string;
  Id?: string;
  addressLine?: string | null;
  AddressLine?: string | null;
  city?: string | null;
  City?: string | null;
  governorate?: string | null;
  Governorate?: string | null;
  country?: string | null;
  Country?: string | null;
  latitude?: ApiValue;
  Latitude?: ApiValue;
  longitude?: ApiValue;
  Longitude?: ApiValue;
  imageUrl?: string | null;
  ImageUrl?: string | null;
}

interface ApiVehicleListDto {
  vehicleId?: string;
  VehicleId?: string;
  make?: string | null;
  Make?: string | null;
  model?: string | null;
  Model?: string | null;
  dailyRate?: ApiValue;
  DailyRate?: ApiValue;
  originalDailyRate?: ApiValue;
  OriginalDailyRate?: ApiValue;
  discountPercentage?: ApiValue;
  DiscountPercentage?: ApiValue;
  currency?: string | null;
  Currency?: string | null;
  imageUrl?: string | null;
  ImageUrl?: string | null;
  rating?: ApiValue;
  Rating?: ApiValue;
  reviewCount?: ApiValue;
  ReviewCount?: ApiValue;
  available?: boolean;
  Available?: boolean;
  locationCity?: string | null;
  LocationCity?: string | null;
  status?: string | null;
  Status?: string | null;
}

interface ApiSupplierDto {
  id?: string;
  Id?: string;
  companyName?: string | null;
  CompanyName?: string | null;
  email?: string | null;
  Email?: string | null;
  phoneNumber?: string | null;
  PhoneNumber?: string | null;
  profileImage?: string | null;
  ProfileImage?: string | null;
  status?: string | null;
  Status?: string | null;
  commercialRegistrationNumber?: string | null;
  CommercialRegistrationNumber?: string | null;
  createdAt?: string | null;
  CreatedAt?: string | null;
}

interface ApiLandingValuePropDto {
  title?: string | null;
  Title?: string | null;
  description?: string | null;
  Description?: string | null;
  accent?: string | null;
  Accent?: string | null;
}

interface ApiLandingFaqDto {
  question?: string | null;
  Question?: string | null;
  answer?: string | null;
  Answer?: string | null;
}

interface ApiLandingSupportDto {
  title?: string | null;
  Title?: string | null;
  description?: string | null;
  Description?: string | null;
  actionLabel?: string | null;
  ActionLabel?: string | null;
}

interface ApiLandingContentDto {
  heroKicker?: string | null;
  HeroKicker?: string | null;
  heroTitle?: string | null;
  HeroTitle?: string | null;
  heroDescription?: string | null;
  HeroDescription?: string | null;
  valueProps?: ApiLandingValuePropDto[] | null;
  ValueProps?: ApiLandingValuePropDto[] | null;
  faqItems?: ApiLandingFaqDto[] | null;
  FaqItems?: ApiLandingFaqDto[] | null;
  support?: ApiLandingSupportDto | null;
  Support?: ApiLandingSupportDto | null;
}

interface ApiDestinationDto {
  id?: string;
  Id?: string;
  city?: string | null;
  City?: string | null;
  country?: string | null;
  Country?: string | null;
  imageUrl?: string | null;
  ImageUrl?: string | null;
  startingPrice?: ApiValue;
  StartingPrice?: ApiValue;
  vehicleCount?: ApiValue;
  VehicleCount?: ApiValue;
}

interface ApiCategoryDto {
  id?: string;
  Id?: string;
  name?: string | null;
  Name?: string | null;
  vehicleCount?: ApiValue;
  VehicleCount?: ApiValue;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

type NormalizedInput<T> = ApiPagedResponse<T> | T[] | null | undefined;

function normalizeCollection<T>(response: NormalizedInput<T>): T[] {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  return response.data ?? response.resultData ?? response.items ?? [];
}

function buildLocationLabel(location: ApiLocationDto): string {
  const parts = [
    location.addressLine ?? location.AddressLine ?? "",
    location.city ?? location.City ?? "",
    location.governorate ?? location.Governorate ?? "",
    location.country ?? location.Country ?? "",
  ].filter(Boolean);

  return parts.join(", ");
}

function normalizeLocation(location: ApiLocationDto): PublicLocation {
  const id = location.id ?? location.Id ?? "";
  const addressLine = location.addressLine ?? location.AddressLine ?? "";
  const city = location.city ?? location.City ?? "";
  const governorate = location.governorate ?? location.Governorate ?? "";
  const country = location.country ?? location.Country ?? "";
  const latitude = asOptionalNumber(location.latitude ?? location.Latitude);
  const longitude = asOptionalNumber(location.longitude ?? location.Longitude);
  const imageUrl = location.imageUrl ?? location.ImageUrl ?? undefined;

  return {
    id,
    label: buildLocationLabel(location) || city || country || "Unknown location",
    addressLine,
    city,
    governorate,
    country,
    latitude,
    longitude,
    imageUrl,
  };
}

function normalizeVehicle(vehicle: ApiVehicleListDto): PublicVehicleCard {
  const imageUrl = vehicle.imageUrl ?? vehicle.ImageUrl ?? "";

  return {
    vehicleId: vehicle.vehicleId ?? vehicle.VehicleId ?? "",
    make: asString(vehicle.make ?? vehicle.Make),
    model: asString(vehicle.model ?? vehicle.Model),
    dailyRate: asNumber(vehicle.dailyRate ?? vehicle.DailyRate),
    originalDailyRate: asOptionalNumber(vehicle.originalDailyRate ?? vehicle.OriginalDailyRate),
    discountPercentage: asOptionalNumber(vehicle.discountPercentage ?? vehicle.DiscountPercentage),
    currency: asString(vehicle.currency ?? vehicle.Currency, "USD"),
    imageUrl,
    rating: asNumber(vehicle.rating ?? vehicle.Rating),
    reviewCount: asNumber(vehicle.reviewCount ?? vehicle.ReviewCount),
    available: Boolean(vehicle.available ?? vehicle.Available),
    locationCity: asString(vehicle.locationCity ?? vehicle.LocationCity),
    status: asString(vehicle.status ?? vehicle.Status),
  };
}

function normalizeSupplier(supplier: ApiSupplierDto): PublicSupplierCard {
  return {
    id: supplier.id ?? supplier.Id ?? "",
    companyName: asString(supplier.companyName ?? supplier.CompanyName, "Supplier"),
    email: asString(supplier.email ?? supplier.Email),
    phoneNumber: asString(supplier.phoneNumber ?? supplier.PhoneNumber),
    profileImage: supplier.profileImage ?? supplier.ProfileImage ?? undefined,
    status: asString(supplier.status ?? supplier.Status),
    commercialRegistrationNumber: asString(
      supplier.commercialRegistrationNumber ?? supplier.CommercialRegistrationNumber
    ),
    createdAt: asString(supplier.createdAt ?? supplier.CreatedAt),
  };
}

function normalizeLandingContent(content: ApiLandingContentDto): PublicLandingContent {
  return {
    heroKicker: asString(content.heroKicker ?? content.HeroKicker),
    heroTitle: asString(content.heroTitle ?? content.HeroTitle),
    heroDescription: asString(content.heroDescription ?? content.HeroDescription),
    valueProps: normalizeCollection(content.valueProps ?? content.ValueProps).map(item => ({
      title: asString(item.title ?? item.Title),
      description: asString(item.description ?? item.Description),
      accent: asString(item.accent ?? item.Accent),
    })),
    faqItems: normalizeCollection(content.faqItems ?? content.FaqItems).map(item => ({
      question: asString(item.question ?? item.Question),
      answer: asString(item.answer ?? item.Answer),
    })),
    support: {
      title: asString(
        content.support?.title ?? content.Support?.title ?? content.support?.Title ?? content.Support?.Title
      ),
      description: asString(
        content.support?.description ??
          content.Support?.description ??
          content.support?.Description ??
          content.Support?.Description
      ),
      actionLabel: asString(
        content.support?.actionLabel ??
          content.Support?.actionLabel ??
          content.support?.ActionLabel ??
          content.Support?.ActionLabel
      ),
    },
  };
}

function normalizeDestination(destination: ApiDestinationDto): PublicDestinationCard {
  return {
    id: destination.id ?? destination.Id ?? "",
    city: asString(destination.city ?? destination.City),
    country: asString(destination.country ?? destination.Country, "Egypt"),
    imageUrl: destination.imageUrl ?? destination.ImageUrl ?? undefined,
    startingPrice: asNumber(destination.startingPrice ?? destination.StartingPrice),
    vehicleCount: asNumber(destination.vehicleCount ?? destination.VehicleCount),
  };
}

function normalizeCategory(category: ApiCategoryDto): PublicCategory {
  return {
    id: category.id ?? category.Id ?? "",
    name: asString(category.name ?? category.Name, "Category"),
    vehicleCount: asOptionalNumber(category.vehicleCount ?? category.VehicleCount),
  };
}

async function fetchJsonOrNull<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn(`Public data request failed for ${url}:`, error);
    }

    return null;
  }
}

export async function fetchPublicLocations(): Promise<PublicLocation[]> {
  const payload = await fetchJsonOrNull<ApiPagedResponse<ApiLocationDto>>(toApiUrl("/api/locations/1/50"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!payload) {
    return [];
  }

  return normalizeCollection(payload)
    .map(normalizeLocation)
    .filter(location => Boolean(location.id));
}

export async function fetchFeaturedVehicles(
  pickupLocationId: string,
  pickupDate: string,
  returnDate: string,
  category?: string,
  limit = 6,
  transmission?: string,
  sortBy?: string
): Promise<PublicVehicleCard[]> {
  const searchParams: Record<string, string> = {
    pickupLocationId,
    pickupDate,
    returnDate,
    page: "1",
    limit: String(limit),
    sortBy: sortBy || "newest",
  };

  // Add category filter if provided
  if (category) {
    searchParams.category = category;
  }

  // Add transmission filter if provided
  if (transmission) {
    searchParams.transmission = transmission;
  }

  const search = new URLSearchParams(searchParams);

  const payload = await fetchJsonOrNull<ApiPagedResponse<ApiVehicleListDto>>(
    toApiUrl(`/api/vehicles/search?${search.toString()}`),
    {
      cache: "no-store",
    }
  );

  if (!payload) {
    return [];
  }

  return normalizeCollection(payload)
    .map(normalizeVehicle)
    .filter(vehicle => Boolean(vehicle.vehicleId));
}

export async function fetchPublicSuppliers(limit = 6): Promise<PublicSupplierCard[]> {
  const payload = await fetchJsonOrNull<ApiPagedResponse<ApiSupplierDto>>(
    toApiUrl(`/api/public/suppliers/1/${String(limit)}`),
    { cache: "no-store" }
  );

  if (!payload) {
    return [];
  }

  return normalizeCollection(payload)
    .map(normalizeSupplier)
    .filter(supplier => Boolean(supplier.id));
}

export async function fetchLandingContent(): Promise<PublicLandingContent | null> {
  const payload = await fetchJsonOrNull<ApiLandingContentDto>(toApiUrl("/api/public/landing"), {
    cache: "no-store",
  });

  if (!payload) {
    return null;
  }

  return normalizeLandingContent(payload);
}

export async function fetchPublicDestinations(limit = 4): Promise<PublicDestinationCard[]> {
  const payload = await fetchJsonOrNull<ApiDestinationDto[] | ApiPagedResponse<ApiDestinationDto>>(
    toApiUrl(`/api/public/destinations?limit=${String(limit)}`),
    { cache: "no-store" }
  );

  if (!payload) {
    return [];
  }

  return normalizeCollection(payload)
    .map(normalizeDestination)
    .filter(destination => Boolean(destination.id));
}

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
  const payload = await fetchJsonOrNull<ApiCategoryDto[] | ApiPagedResponse<ApiCategoryDto>>(
    toApiUrl(`/api/admin/categories`),
    { cache: "no-store" }
  );

  if (!payload) {
    return [];
  }

  return normalizeCollection(payload)
    .map(normalizeCategory)
    .filter(category => Boolean(category.id));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

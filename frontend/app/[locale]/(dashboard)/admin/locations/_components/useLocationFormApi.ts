"use client";

import { useCallback, useRef, useState } from "react";
import type { Location } from "@/api-clients/locations/locations";
import {
  createLocation,
  getLocationById,
  updateLocation,
  uploadLocationImage,
} from "@/api-clients/locations/locations";
import { logger } from "@/utils/logger";

interface LocationFormData {
  userId: string;
  addressLine: string;
  city: string;
  governorate: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  isPrimary: boolean;
}

interface UseLocationFormApiOptions {
  readonly mode: "create" | "edit";
  readonly accessToken: string | undefined;
  readonly locationId?: string;
  readonly onSuccess: (message: string) => void;
  readonly onError: (message: string) => void;
  readonly onLoadError: (message: string) => void;
  readonly successMessage: string;
  readonly errorMessage: string;
  readonly loadErrorMessage: string;
  readonly imageUploadFailedMessage: string;
}

function parseApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const resp = err.response as { data?: { message?: string } };
    return resp.data?.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function buildCoordinates(formData: LocationFormData) {
  return {
    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
  };
}

export function useLocationFormApi({
  mode,
  accessToken,
  locationId,
  onSuccess,
  onError,
  onLoadError,
  successMessage,
  errorMessage,
  loadErrorMessage,
  imageUploadFailedMessage,
}: UseLocationFormApiOptions) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");
  const [initialData, setInitialData] = useState<Location | null>(null);

  const callbacksRef = useRef({
    onSuccess,
    onError,
    onLoadError,
  });
  callbacksRef.current = { onSuccess, onError, onLoadError };

  const messagesRef = useRef({
    successMessage,
    errorMessage,
    loadErrorMessage,
    imageUploadFailedMessage,
  });
  messagesRef.current = {
    successMessage,
    errorMessage,
    loadErrorMessage,
    imageUploadFailedMessage,
  };

  const fetchLocation = useCallback(async () => {
    if (mode !== "edit" || !accessToken || !locationId) return;

    try {
      const data = await getLocationById(accessToken, locationId);
      setInitialData(data);
      return data;
    } catch (err) {
      callbacksRef.current.onLoadError(messagesRef.current.loadErrorMessage);
      logger.error("Failed to load location", err);
      return null;
    } finally {
      setFetching(false);
    }
  }, [mode, accessToken, locationId]);

  const saveLocation = useCallback(
    async (formData: LocationFormData, userId: string, token: string): Promise<Location> => {
      const coords = buildCoordinates(formData);
      if (mode === "create") {
        return createLocation(token, {
          ...formData,
          userId,
          ...coords,
          imageUrl: null as string | null,
        });
      }
      if (!locationId) throw new Error("Missing location ID for update");
      return updateLocation(token, locationId, {
        ...formData,
        userId: formData.userId || userId,
        ...coords,
      });
    },
    [mode, locationId]
  );

  const attachImage = useCallback(async (token: string, locId: string, file: File): Promise<boolean> => {
    try {
      await uploadLocationImage(token, locId, file);
      return true;
    } catch {
      return false;
    }
  }, []);

  const submitForm = useCallback(
    async (formData: LocationFormData, userId: string, imageFile: File | null) => {
      if (!accessToken) {
        callbacksRef.current.onError("Unauthorized. Please log in.");
        return false;
      }

      setLoading(true);

      try {
        const resultLocation = await saveLocation(formData, userId, accessToken);

        if (imageFile) {
          const uploaded = await attachImage(accessToken, resultLocation.id, imageFile);
          if (!uploaded && mode === "create") {
            callbacksRef.current.onError(messagesRef.current.imageUploadFailedMessage);
            return false;
          }
        }

        callbacksRef.current.onSuccess(messagesRef.current.successMessage);
        return true;
      } catch (err: unknown) {
        callbacksRef.current.onError(parseApiError(err, messagesRef.current.errorMessage));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, mode, saveLocation, attachImage]
  );

  return {
    loading,
    fetching,
    initialData,
    fetchLocation,
    submitForm,
  };
}

export type { LocationFormData };

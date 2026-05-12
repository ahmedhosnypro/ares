import { logger } from "@/utils/logger";

type ApiFetchOptions = RequestInit & {
  accessToken?: string;
};

/**
 * Typed API error that exposes the HTTP status code.
 * Callers can use `err instanceof ApiError && err.status === 404`
 * to distinguish "endpoint not found" from real server errors.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string
  ) {
    super(`API Error ${String(status)}: ${statusText}`);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
  }
  return baseUrl.replace(/\/$/, "");
}

export function toApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${getApiBaseUrl()}${normalizedEndpoint}`;
}

export async function apiFetchJson<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { accessToken, headers, ...restOptions } = options;
  const mergedHeaders = new Headers(headers ?? {});

  if (!mergedHeaders.has("Content-Type") && restOptions.body && !(restOptions.body instanceof FormData)) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  if (accessToken) {
    mergedHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(toApiUrl(endpoint), {
    cache: "no-store",
    ...restOptions,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.debug("Backend Error Details", errorBody);
    throw new ApiError(response.status, response.statusText, errorBody);
  }

  return (await response.json()) as T;
}

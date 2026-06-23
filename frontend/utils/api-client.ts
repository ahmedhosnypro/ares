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
    let errorMessage = `API Error ${String(status)}: ${statusText}`;
    try {
      if (body) {
        const parsed = JSON.parse(body);
        if (parsed.validationErrors && Array.isArray(parsed.validationErrors) && parsed.validationErrors.length > 0) {
          errorMessage = parsed.validationErrors.map((e: any) => e.message).join(" ");
        } else if (parsed.message) {
          errorMessage = parsed.message;
        }
      }
    } catch (e) {
      // Ignore JSON parse error
    }

    super(errorMessage);
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

    // If we get a 401 with an access token, the token is expired
    // NextAuth will automatically refresh on next getSession() call
    // The useSessionMonitor hook will detect if refresh fails and force logout
    if (response.status === 401 && accessToken) {
      logger.warn("Received 401 - access token expired, session will auto-refresh");
    }

    throw new ApiError(response.status, response.statusText, errorBody);
  }

  return (await response.json()) as T;
}

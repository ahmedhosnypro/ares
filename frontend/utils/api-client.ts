type ApiFetchOptions = RequestInit & {
  accessToken?: string;
};

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
    throw new Error(`API Error ${String(response.status)}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

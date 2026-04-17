import { getApiBaseUrl } from "@/utils/api-client";

export function toImageUrl(imagePath?: string | null): string | undefined {
  if (!imagePath) {
    return undefined;
  }

  if (/^(https?:|blob:|data:)/i.test(imagePath)) {
    return imagePath;
  }

  if (imagePath.startsWith("/")) {
    return `${getApiBaseUrl()}${imagePath}`;
  }

  return `${getApiBaseUrl()}/${imagePath}`;
}

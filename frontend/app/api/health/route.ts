import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

/**
 * Health check endpoint for the frontend application
 *
 * This endpoint provides basic health status information and optionally
 * checks connectivity to the backend API.
 *
 * No authentication required.
 */

interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  backend?: {
    status: string;
    url: string;
  };
}

/**
 * GET /api/health
 *
 * Returns health status of the frontend application
 *
 * Query Parameters:
 * - checkBackend: "true" to include backend connectivity check (optional)
 *
 * @example
 * GET /api/health
 * GET /api/health?checkBackend=true
 */
export async function GET(request: Request): Promise<NextResponse<HealthResponse>> {
  const { searchParams } = new URL(request.url);
  const checkBackend = searchParams.get("checkBackend") === "true";

  const response: HealthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  };

  // Optionally check backend connectivity
  if (checkBackend) {
    const backendUrl = getApiBaseUrl();

    try {
      const backendResponse = await fetch(`${backendUrl}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Short timeout for health checks
        signal: AbortSignal.timeout(5000),
      });

      if (backendResponse.ok) {
        response.backend = {
          status: "healthy",
          url: backendUrl,
        };
      } else {
        response.backend = {
          status: "unhealthy",
          url: backendUrl,
        };
        response.status = "degraded";
      }
    } catch (error) {
      response.backend = {
        status: "unreachable",
        url: backendUrl,
      };
      response.status = "degraded";

      // Log error for debugging but don't expose details to client
      logger.error("Backend health check failed:", error);
    }
  }

  return NextResponse.json(response, {
    status: response.status === "healthy" ? 200 : 503,
  });
}

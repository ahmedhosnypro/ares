import { components, paths } from "./generated/api";

export * from "./types";

/**
 * Helpful type aliases for the generated API schemas
 */
export type Schema = components["schemas"];

/**
 * Helper to get the request body type for a specific path and method
 */
export type RequestBody<
  T extends keyof paths,
  M extends keyof paths[T] & ("post" | "put" | "patch" | "delete"),
> = paths[T][M] extends { requestBody?: { content: { "application/json": infer B } } } ? B : never;

/**
 * Helper to get the response type for a specific path, method, and status code
 */
export type ResponseBody<
  T extends keyof paths,
  M extends keyof paths[T] & ("get" | "post" | "put" | "patch" | "delete"),
  S extends number | string = 200,
> = paths[T][M] extends { responses: infer Responses }
  ? Responses extends Record<string | number, unknown>
    ? S extends keyof Responses
      ? Responses[S] extends { content: { "application/json": infer R } }
        ? R
        : never
      : never
    : never
  : never;

export type { components, paths };

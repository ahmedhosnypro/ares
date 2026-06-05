import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  status: string;
  roles: string[];
  [key: string]: unknown;
}

interface UserResponse {
  data?: User[];
  message?: string;
  [key: string]: unknown;
}

/**
 * GET paginated users
 */
export async function getUsers(page = 1, size = 10): Promise<UserResponse> {
  const session = await getSession();

  return apiFetchJson<UserResponse>(`/api/admin/users/${String(page)}/${String(size)}`, {
    method: "POST",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify({
      keyword: null,
      types: ["user"],
    }),
  });
}

// create new user
export const createUser = async (payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
  roles: string[];
}) => {
  const session = await getSession();

  if (!session?.accessToken) {
    throw new Error("No access token found");
  }

  return apiFetchJson<string>(`/api/admin/users/create`, {
    method: "POST",
    accessToken: session.accessToken,
    body: JSON.stringify(payload),
  });
};

/**
 * GET user by id
 */
export async function getUserById(id: string): Promise<User> {
  const session = await getSession();

  const data = await apiFetchJson<User>(`/api/admin/users/${id}`, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });

  logger.debug("User details response", data);

  return data;
}

/**
 * UPDATE user
 */
export async function updateUser(
  id: string,
  payload: {
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    status: string;
    roles: string[];
  }
): Promise<UserResponse> {
  const session = await getSession();

  return apiFetchJson<UserResponse>(`/api/admin/users/${id}/edit`, {
    method: "PUT",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify(payload),
  });
}

// toggle status
export async function toggleUserStatus(userId: string): Promise<UserResponse> {
  const session = await getSession();

  return apiFetchJson<UserResponse>(`/api/admin/users/${userId}/toggle-status`, {
    method: "PUT",
    accessToken: session?.accessToken ?? undefined,
  });
}

/**
 * Response returned by the hard-delete endpoint.
 */
export interface DeleteUserResponse {
  success: boolean;
  message: string;
  userId: string;
  deletedRelatedRecords?: Record<string, number>;
}

/**
 * Permanently delete a user (Admin only).
 *
 * Succeeds only when the user has no critical business records. When the
 * backend blocks the deletion it returns a 409 with an explanatory message,
 * which surfaces here as an `ApiError` whose body contains that message.
 */
export async function deleteUser(userId: string): Promise<DeleteUserResponse> {
  const session = await getSession();

  return apiFetchJson<DeleteUserResponse>(`/api/admin/users/${userId}`, {
    method: "DELETE",
    accessToken: session?.accessToken ?? undefined,
  });
}

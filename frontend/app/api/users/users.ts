import { getSession } from "next-auth/react";

const BASE_URL = "http://localhost:5000/api";

/**
 * Helper to get auth headers
 */
async function authHeaders() {
  const session = await getSession();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };
}

/**
 * GET paginated users
 */
export async function getUsers(page = 1, size = 10) {
  const res = await fetch(`${BASE_URL}/admin/users/${page}/${size}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      searchTerm: null,
      role: null,
      status: null,
    }),
  });

  if (!res.ok) throw new Error("Failed to fetch users");

  return res.json();
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

  const res = await fetch(`${BASE_URL}/admin/users/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      accept: "text/plain",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to create user");
  }

  return await res.text(); // backend بيرجع string
};
/**
 * GET user by id
 */
export async function getUserById(id: string) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
    method: "GET",
    headers: await authHeaders(),
  });

  const text = await res.text(); 

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("Invalid JSON response:", text);
  }

  console.log("URL:", `${BASE_URL}/admin/users/${id}`);
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", data);

  if (!res.ok) {
    throw new Error(data?.message || "User not found");
  }

  return data;
}

/**
 * UPDATE user
 */
export async function updateUser(id: string, payload: {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  status: string;
  roles: string[];
}) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/edit`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Update failed");
  }

  return data;
}


// toggle status
export async function toggleUserStatus(userId: string) {
  const res = await fetch(
    `${BASE_URL}/admin/users/${userId}/toggle-status`,
    {
      method: "PUT",
      headers: await authHeaders(),
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Failed to toggle user status");
  }

  return data;
}


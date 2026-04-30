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
export async function getSuppliers(page = 1, size = 10) {
  const res = await fetch(`${BASE_URL}/suppliers/${page}/${size}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      keyword: null,
      types: ["user"],
    }),
  });

  console.log(res);
  

  if (!res.ok) throw new Error("Failed to fetch suppliers");

  return res.json();
}

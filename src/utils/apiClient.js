import { getAuthToken } from "./session";

export async function apiRequest(url, { method = "GET", body, headers = {} } = {}) {
  const token = getAuthToken();
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: mergedHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}


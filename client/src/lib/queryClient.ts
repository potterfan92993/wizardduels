import { QueryClient } from "@tanstack/react-query";

/**
 * Base URL for the backend API.
 * In production, this points to Render.
 * In local dev, it can still be overridden.
 */
const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * Builds the full API URL.
 * If a full URL is passed, it is used as-is.
 * Otherwise, it is prefixed with the backend base URL.
 */
function buildUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

/**
 * Generic API request helper
 */
export async function apiRequest(
  method: string,
  url: string,
  body?: unknown,
  headers?: HeadersInit
) {
  const fullUrl = buildUrl(url);

  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.error || data?.message || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return res.json();
}

/**
 * React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

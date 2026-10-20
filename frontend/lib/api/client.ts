import "server-only";
import { getToken } from "@/lib/auth";
import type { ApiResponse } from "./types";

const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:9191").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | undefined>;

export interface ApiOptions extends RequestInit {
  query?: Query;
  /** Forward the session token as a Bearer header. */
  auth?: boolean;
}

export function backendUrl(path: string, query?: Query): string {
  const url = new URL(`${BACKEND_URL}/api/v1${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Calls the backend and unwraps the `ApiResponse` envelope; non-2xx answers throw `ApiError`. */
export async function api<T>(path: string, { query, auth = false, headers, ...init }: ApiOptions = {}): Promise<T> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (typeof init.body === "string" && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = await getToken();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(backendUrl(path, query), { ...init, headers: requestHeaders });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? response.statusText);
  }
  return body?.data as T;
}

import "server-only";
import { cookies } from "next/headers";

export const TOKEN_COOKIE = "piocart_token";

// Matches the backend default JWT lifetime (app.jwt.expiration=PT24H).
const TOKEN_MAX_AGE = 60 * 60 * 24;

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export async function setToken(token: string): Promise<void> {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearToken(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
}

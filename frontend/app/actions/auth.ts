"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/client";
import type { AuthResponse } from "@/lib/api/types";
import { clearToken, setToken } from "@/lib/auth";
import {
  loginSchema,
  registerSchema,
  safeReturnTo,
  type LoginState,
  type RegisterState,
} from "@/lib/auth-schema";

const GENERIC_ERROR = "Si è verificato un errore. Riprova tra qualche istante.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    const { token } = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    await setToken(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { message: "Email o password non corretti.", values };
    }
    return { message: GENERIC_ERROR, values };
  }

  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const values = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { firstName, lastName, email, password } = parsed.data;
  try {
    const { token } = await api<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName, email, password }),
      cache: "no-store",
    });
    await setToken(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return { fieldErrors: { email: ["Esiste già un account con questa email"] }, values };
    }
    return { message: GENERIC_ERROR, values };
  }

  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function logout() {
  await clearToken();
  redirect("/");
}

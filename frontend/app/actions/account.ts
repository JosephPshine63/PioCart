"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { clearToken, getToken } from "@/lib/auth";
import { profileSchema, type ProfileState } from "@/lib/account-schema";

const LOGIN_URL = "/login?returnTo=%2Faccount";

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  if (!(await getToken())) redirect(LOGIN_URL);

  const values = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
  };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  let user: User;
  try {
    user = await api<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(parsed.data),
      auth: true,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearToken();
      redirect(LOGIN_URL);
    }
    return { message: "Non è stato possibile salvare le modifiche. Riprova tra qualche istante.", values };
  }

  // The header reads the user with no-store: re-render it so it shows the new name.
  refresh();
  return { saved: true, values: { firstName: user.firstName, lastName: user.lastName } };
}

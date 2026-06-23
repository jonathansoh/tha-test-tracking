"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { synthEmail } from "@/lib/username";

export type LoginState = { error?: string };

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: synthEmail(username),
    password,
  });

  if (error) {
    return { error: "Invalid username or password." };
  }

  redirect("/dashboard");
}

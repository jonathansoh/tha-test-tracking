"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { synthEmail } from "@/lib/username";
import { logWarn } from "@/lib/logger";

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
    // Log the real reason (bad credentials vs. misconfig/network) without
    // exposing it to the user.
    logWarn("auth.signIn", error.message, { username, code: error.status });
    return { error: "Invalid username or password." };
  }

  redirect("/dashboard");
}

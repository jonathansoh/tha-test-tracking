"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isValidUsername,
  normalizeUsername,
  synthEmail,
  USERNAME_RULE,
} from "@/lib/username";
import { logError } from "@/lib/logger";

export type InviteState = { error?: string };

export async function consumeInvite(
  token: string,
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isValidUsername(username)) {
    return { error: `Invalid username. ${USERNAME_RULE}.` };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const admin = createAdminClient();

  // Re-validate the invite server-side (RLS is bypassed by the service role).
  const { data: invite } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.used_at) {
    return { error: "This invite link is invalid or has already been used." };
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: "This invite link has expired. Ask an admin for a new one." };
  }

  const uname = normalizeUsername(username);

  // Username must be unique.
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", uname)
    .maybeSingle();
  if (existing) {
    return { error: "That username is taken. Please choose another." };
  }

  // Create the auth user (synthetic email, no confirmation needed).
  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: synthEmail(uname),
      password,
      email_confirm: true,
      user_metadata: { username: uname },
    });
  if (createErr || !created.user) {
    logError("invite.createUser", createErr ?? "no user returned", {
      username: uname,
    });
    return { error: "Could not create your account. Please try again." };
  }

  // Create the profile row.
  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    username: uname,
    role: invite.role,
  });
  if (profileErr) {
    logError("invite.createProfile", profileErr, { username: uname });
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Could not finish setup. Please try again." };
  }

  // Mark the invite consumed.
  await admin
    .from("invites")
    .update({ used_by: created.user.id, used_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Transfer any issues that were assigned to this pending invite to the
  // now-active account.
  await admin
    .from("issues")
    .update({
      assigned_to: created.user.id,
      assigned_invite_id: null,
      assigned_invite_name: null,
    })
    .eq("assigned_invite_id", invite.id);

  // Sign the new user in so cookies are set, then go to the dashboard.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({
    email: synthEmail(uname),
    password,
  });

  redirect("/dashboard");
}

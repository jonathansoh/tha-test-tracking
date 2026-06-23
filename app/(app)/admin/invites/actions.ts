"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { logError } from "@/lib/logger";
import type { Role } from "@/lib/types";

type Result = { error?: string; ok?: true; token?: string };

async function requireAdminProfile() {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You are not signed in." as const };
  if (profile.role !== "admin")
    return { error: "Admins only." as const };
  return { profile };
}

export async function createInvite(role: Role, note: string): Promise<Result> {
  const ctx = await requireAdminProfile();
  if ("error" in ctx) return { error: ctx.error };

  if (role !== "admin" && role !== "user") {
    return { error: "Invalid role." };
  }

  const token = crypto.randomUUID();
  const supabase = await createClient();
  const { error } = await supabase.from("invites").insert({
    token,
    role,
    note: note.trim() || null,
    created_by: ctx.profile.id,
  });
  if (error) {
    logError("admin.createInvite", error, { role });
    return { error: "Could not create the invite." };
  }

  revalidatePath("/admin/invites");
  return { ok: true, token };
}

export async function revokeInvite(inviteId: string): Promise<Result> {
  const ctx = await requireAdminProfile();
  if ("error" in ctx) return { error: ctx.error };

  const supabase = await createClient();
  const { error } = await supabase.from("invites").delete().eq("id", inviteId);
  if (error) {
    logError("admin.revokeInvite", error, { inviteId });
    return { error: "Could not revoke the invite." };
  }

  revalidatePath("/admin/invites");
  return { ok: true };
}

export async function resetPassword(
  userId: string,
  newPassword: string,
): Promise<Result> {
  const ctx = await requireAdminProfile();
  if ("error" in ctx) return { error: ctx.error };

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (error) {
    logError("admin.resetPassword", error, { userId });
    return { error: "Could not reset the password." };
  }

  return { ok: true };
}

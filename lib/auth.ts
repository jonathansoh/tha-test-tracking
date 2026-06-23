import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Returns the signed-in user's profile, or null if not signed in. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Requires a signed-in user; redirects to /login otherwise. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Requires an admin; redirects to /dashboard for non-admins, /login if signed out. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

/** True when this profile may manage the given issue (admin or its assignee). */
export function canManageIssue(
  profile: Pick<Profile, "id" | "role">,
  issue: { assigned_to: string | null },
): boolean {
  return profile.role === "admin" || issue.assigned_to === profile.id;
}

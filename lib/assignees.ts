import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AssigneeOption } from "@/lib/assignee-utils";

/**
 * Assignable people: active users (profiles) plus pending invites (accounts
 * invited but not yet activated). Pending invites are only readable by admins
 * (RLS), so non-admins simply see the active users.
 */
export async function getAssigneeOptions(): Promise<AssigneeOption[]> {
  const supabase = await createClient();
  const [{ data: profiles }, { data: invites }] = await Promise.all([
    supabase.from("profiles").select("id, username").order("username"),
    supabase
      .from("invites")
      .select("id, invitee_name, note")
      .is("used_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const users: AssigneeOption[] = (profiles ?? []).map((p) => ({
    value: `user:${p.id}`,
    label: p.username,
    pending: false,
  }));
  const pending: AssigneeOption[] = (invites ?? []).map((i) => ({
    value: `invite:${i.id}`,
    label: `${i.invitee_name || i.note || "Pending invite"} (pending)`,
    pending: true,
  }));
  return [...users, ...pending];
}

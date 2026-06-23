import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { AdminClient } from "./admin-client";

export const metadata = { title: "Admin — Issue Tracker" };

export default async function AdminInvitesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: invites }, { data: users }] = await Promise.all([
    supabase
      .from("invites")
      .select("id, token, role, invitee_name, note, used_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, username, role, created_at")
      .order("username"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Invite people and manage user accounts.
        </p>
      </div>
      <AdminClient invites={invites ?? []} users={users ?? []} />
    </div>
  );
}

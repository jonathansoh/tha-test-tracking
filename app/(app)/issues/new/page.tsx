import { createClient } from "@/lib/supabase/server";
import { NewIssueForm } from "./new-issue-form";

export const metadata = { title: "Raise an issue — Issue Tracker" };

export default async function NewIssuePage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .order("username");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Raise an issue</h1>
        <p className="text-sm text-muted-foreground">
          Report a bug or suggest a new feature. The date raised is recorded
          automatically.
        </p>
      </div>
      <NewIssueForm assignees={profiles ?? []} />
    </div>
  );
}

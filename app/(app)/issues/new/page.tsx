import { getAssigneeOptions } from "@/lib/assignees";
import { NewIssueForm } from "./new-issue-form";

export const metadata = { title: "Raise an issue — Issue Tracker" };

export default async function NewIssuePage() {
  const assigneeOptions = await getAssigneeOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Raise an issue</h1>
        <p className="text-sm text-muted-foreground">
          Report a bug or suggest a new feature. The date raised is recorded
          automatically.
        </p>
      </div>
      <NewIssueForm assigneeOptions={assigneeOptions} />
    </div>
  );
}

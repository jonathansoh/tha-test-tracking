import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { canManageIssue, requireProfile } from "@/lib/auth";
import { getAssigneeOptions } from "@/lib/assignees";
import { assignmentValue } from "@/lib/assignee-utils";
import { MEDIA_BUCKET } from "@/lib/constants";
import { formatKulDate, formatKulDateTime } from "@/lib/time";
import type { Attachment, Comment, Issue } from "@/lib/types";
import { StatusBadge, TypeBadge } from "@/components/issue-badges";
import { ManagePanel } from "./manage-panel";
import { CommentForm } from "./comment-form";

const ISSUE_SELECT = `
  *,
  raised_by_profile:profiles!issues_raised_by_fkey(id,username),
  assigned_to_profile:profiles!issues_assigned_to_fkey(id,username),
  reviewed_by_profile:profiles!issues_reviewed_by_fkey(id,username)
`;

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: issueData } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!issueData) notFound();
  const issue = issueData as unknown as Issue & {
    reviewed_by_profile?: { id: string; username: string } | null;
  };

  const [{ data: attachmentsData }, { data: commentsData }, assigneeOptions] =
    await Promise.all([
      supabase
        .from("attachments")
        .select("*")
        .eq("issue_id", id)
        .order("created_at"),
      supabase
        .from("comments")
        .select("*, author:profiles!comments_author_id_fkey(id,username)")
        .eq("issue_id", id)
        .order("created_at"),
      getAssigneeOptions(),
    ]);

  const attachments = (attachmentsData ?? []) as Attachment[];
  const comments = (commentsData ?? []) as unknown as Comment[];

  // Signed URLs for the private media bucket.
  const signedByPath = new Map<string, string>();
  if (attachments.length > 0) {
    const { data: signed } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(
        attachments.map((a) => a.storage_path),
        60 * 60,
      );
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
    }
  }

  const canManage = canManageIssue(profile, issue);
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={issue.type} />
        <StatusBadge status={issue.status} />
      </div>

      <h1 className="text-2xl font-semibold">
        {issue.title || "(no title)"}
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 md:col-span-2">
          <section>
            <h2 className="mb-1 text-sm font-semibold">Comment</h2>
            <p className="whitespace-pre-wrap text-sm">{issue.description}</p>
          </section>

          {issue.review_comment && (
            <section className="rounded-md border bg-muted/40 p-3">
              <h2 className="mb-1 text-sm font-semibold">
                {issue.status === "rejected"
                  ? "Rejection reason"
                  : "Review note"}
              </h2>
              <p className="whitespace-pre-wrap text-sm">
                {issue.review_comment}
              </p>
              {issue.reviewed_by_profile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  by {issue.reviewed_by_profile.username}
                  {issue.reviewed_at
                    ? ` · ${formatKulDateTime(issue.reviewed_at)}`
                    : ""}
                </p>
              )}
            </section>
          )}

          {attachments.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">Attachments</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {attachments.map((a) => {
                  const url = signedByPath.get(a.storage_path);
                  if (!url) return null;
                  return (
                    <div
                      key={a.id}
                      className="overflow-hidden rounded-md border"
                    >
                      {a.file_type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={a.file_name ?? "attachment"}
                          className="h-48 w-full object-contain bg-muted"
                        />
                      ) : (
                        <video
                          src={url}
                          controls
                          className="h-48 w-full bg-black"
                        />
                      )}
                      <p className="truncate px-2 py-1 text-xs text-muted-foreground">
                        {a.file_name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Comments */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">
              Discussion ({comments.length})
            </h2>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-md border p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {c.author?.username ?? "Unknown"}
                    </span>{" "}
                    · {formatKulDateTime(c.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </div>
            <CommentForm issueId={issue.id} />
          </section>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <Meta label="Raised by" value={issue.raised_by_profile?.username} />
            <Meta
              label="Date raised (KUL)"
              value={formatKulDateTime(issue.created_at)}
            />
            <Meta
              label="Assigned to"
              value={
                issue.assigned_to_profile?.username ??
                (issue.assigned_invite_name
                  ? `${issue.assigned_invite_name} (pending)`
                  : "Unassigned")
              }
            />
            <Meta
              label="Tentative completion"
              value={
                issue.tentative_completion_date
                  ? formatKulDate(issue.tentative_completion_date)
                  : "—"
              }
            />
            {issue.completed_at && (
              <Meta
                label="Completed"
                value={formatKulDateTime(issue.completed_at)}
              />
            )}
          </div>

          <ManagePanel
            issueId={issue.id}
            type={issue.type}
            status={issue.status}
            assignmentValue={assignmentValue(issue)}
            tentativeDate={issue.tentative_completion_date}
            assigneeOptions={assigneeOptions}
            canManage={canManage}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

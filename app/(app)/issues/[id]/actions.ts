"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, canManageIssue } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { parseAssignee } from "@/lib/assignee-utils";

type ActionResult = { error?: string; ok?: true };

async function loadContext(issueId: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You are not signed in." as const };

  const { data: issue } = await supabase
    .from("issues")
    .select("id, type, status, assigned_to")
    .eq("id", issueId)
    .maybeSingle();
  if (!issue) return { error: "Issue not found." as const };

  return { supabase, profile, issue };
}

function refresh(issueId: string) {
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/dashboard");
}

// --- Comments: any signed-in user ---------------------------------------
export async function addComment(
  issueId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { error } = await supabase.from("comments").insert({
    issue_id: issueId,
    author_id: user.id,
    body,
  });
  if (error) {
    logError("comments.add", error, { issueId, userId: user.id });
    return { error: "Could not post your comment." };
  }

  refresh(issueId);
  return { ok: true };
}

// --- Add attachments to an existing issue: any signed-in user -----------
export async function addAttachments(
  issueId: string,
  attachments: {
    path: string;
    file_type: "image" | "video";
    mime_type: string;
    file_name: string;
  }[],
): Promise<ActionResult> {
  if (attachments.length === 0) return { error: "No files to add." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { error } = await supabase.from("attachments").insert(
    attachments.map((a) => ({
      issue_id: issueId,
      storage_path: a.path,
      file_type: a.file_type,
      mime_type: a.mime_type,
      file_name: a.file_name,
      uploaded_by: user.id,
    })),
  );
  if (error) {
    logError("attachments.add", error, { issueId, userId: user.id });
    return { error: "Could not add the files." };
  }

  refresh(issueId);
  return { ok: true };
}

// --- Feature review: admin or assignee ----------------------------------
export async function reviewFeature(
  issueId: string,
  decision: "accept" | "reject",
  comment: string,
): Promise<ActionResult> {
  const ctx = await loadContext(issueId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile, issue } = ctx;

  if (issue.type !== "feature" || issue.status !== "pending_review") {
    return { error: "This feature request is not awaiting review." };
  }
  if (!canManageIssue(profile, issue)) {
    return { error: "You don't have permission to review this." };
  }

  const trimmed = comment.trim();
  if (decision === "reject" && !trimmed) {
    return { error: "A reason is required when rejecting." };
  }

  const { error } = await supabase
    .from("issues")
    .update({
      status: decision === "accept" ? "in_progress" : "rejected",
      review_comment: trimmed || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", issueId);
  if (error) {
    logError("issues.review", error, { issueId, decision });
    return { error: "Could not save the decision." };
  }

  refresh(issueId);
  return { ok: true };
}

// --- Assignment: admin only (active user or pending invite) -------------
export async function assignIssue(
  issueId: string,
  assigneeValue: string | null,
): Promise<ActionResult> {
  const ctx = await loadContext(issueId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  if (profile.role !== "admin") {
    return { error: "Only an admin can change the assignee." };
  }

  const assignee = parseAssignee(assigneeValue);
  const patch: {
    assigned_to: string | null;
    assigned_invite_id: string | null;
    assigned_invite_name: string | null;
  } = { assigned_to: null, assigned_invite_id: null, assigned_invite_name: null };

  if (assignee.kind === "user") {
    patch.assigned_to = assignee.id;
  } else if (assignee.kind === "invite") {
    patch.assigned_invite_id = assignee.id;
    const { data: inv } = await supabase
      .from("invites")
      .select("invitee_name, note")
      .eq("id", assignee.id)
      .maybeSingle();
    patch.assigned_invite_name =
      inv?.invitee_name || inv?.note || "Pending invite";
  }

  const { error } = await supabase.from("issues").update(patch).eq("id", issueId);
  if (error) {
    logError("issues.assign", error, { issueId, assigneeValue });
    return { error: "Could not update the assignee." };
  }

  refresh(issueId);
  return { ok: true };
}

// --- Tentative completion date: admin or assignee -----------------------
export async function setTentativeDate(
  issueId: string,
  date: string | null,
): Promise<ActionResult> {
  const ctx = await loadContext(issueId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile, issue } = ctx;

  if (!canManageIssue(profile, issue)) {
    return { error: "You don't have permission to change this." };
  }

  const { error } = await supabase
    .from("issues")
    .update({ tentative_completion_date: date || null })
    .eq("id", issueId);
  if (error) {
    logError("issues.setDate", error, { issueId, date });
    return { error: "Could not update the date." };
  }

  refresh(issueId);
  return { ok: true };
}

// --- Mark complete: admin or assignee -----------------------------------
export async function markComplete(issueId: string): Promise<ActionResult> {
  const ctx = await loadContext(issueId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile, issue } = ctx;

  if (!canManageIssue(profile, issue)) {
    return { error: "You don't have permission to complete this." };
  }
  if (issue.status === "rejected") {
    return { error: "A rejected request can't be completed." };
  }

  const { error } = await supabase
    .from("issues")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", issueId);
  if (error) {
    logError("issues.complete", error, { issueId });
    return { error: "Could not mark as completed." };
  }

  refresh(issueId);
  return { ok: true };
}

// --- Reopen: admin or assignee ------------------------------------------
export async function reopenIssue(issueId: string): Promise<ActionResult> {
  const ctx = await loadContext(issueId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile, issue } = ctx;

  if (!canManageIssue(profile, issue)) {
    return { error: "You don't have permission to reopen this." };
  }

  // Completed → back to in progress. Rejected feature → back to review.
  const next =
    issue.status === "rejected" && issue.type === "feature"
      ? "pending_review"
      : "in_progress";

  const { error } = await supabase
    .from("issues")
    .update({ status: next, completed_at: null })
    .eq("id", issueId);
  if (error) {
    logError("issues.reopen", error, { issueId });
    return { error: "Could not reopen the issue." };
  }

  refresh(issueId);
  return { ok: true };
}

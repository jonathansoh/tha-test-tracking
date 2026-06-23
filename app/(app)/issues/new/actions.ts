"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import type { IssueType } from "@/lib/types";

export type NewIssueInput = {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  assignedTo: string | null;
  tentativeDate: string | null;
  attachments: {
    path: string;
    file_type: "image" | "video";
    mime_type: string;
    file_name: string;
  }[];
};

export type CreateIssueResult = { error: string } | { ok: true; id: string };

export async function createIssue(
  input: NewIssueInput,
): Promise<CreateIssueResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  if (input.type !== "bug" && input.type !== "feature") {
    return { error: "Choose whether this is a bug or a feature request." };
  }
  if (!input.description.trim()) {
    return { error: "A comment is required." };
  }

  // Features await review; bugs are open (in progress) immediately.
  const status = input.type === "feature" ? "pending_review" : "in_progress";

  const { error: issueErr } = await supabase.from("issues").insert({
    id: input.id,
    type: input.type,
    title: input.title.trim() || null,
    description: input.description.trim(),
    status,
    raised_by: user.id,
    assigned_to: input.assignedTo || null,
    tentative_completion_date: input.tentativeDate || null,
  });
  if (issueErr) {
    logError("issues.create", issueErr, { userId: user.id, type: input.type });
    return { error: "Could not save the issue. Please try again." };
  }

  if (input.attachments.length > 0) {
    const { error: attachErr } = await supabase.from("attachments").insert(
      input.attachments.map((a) => ({
        issue_id: input.id,
        storage_path: a.path,
        file_type: a.file_type,
        mime_type: a.mime_type,
        file_name: a.file_name,
        uploaded_by: user.id,
      })),
    );
    if (attachErr) {
      // The issue is saved; surface a soft warning rather than failing hard.
      logError("issues.attachments", attachErr, { issueId: input.id });
      return { error: "Issue saved, but attachments failed to record." };
    }
  }

  return { ok: true, id: input.id };
}

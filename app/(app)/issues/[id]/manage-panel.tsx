"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  assignIssue,
  markComplete,
  reopenIssue,
  reviewFeature,
  setTentativeDate,
} from "./actions";
import type { IssueStatus, IssueType } from "@/lib/types";
import { UNASSIGNED_VALUE, type AssigneeOption } from "@/lib/assignee-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function ManagePanel({
  issueId,
  type,
  status,
  assignmentValue,
  tentativeDate,
  assigneeOptions,
  canManage,
  isAdmin,
}: {
  issueId: string;
  type: IssueType;
  status: IssueStatus;
  assignmentValue: string;
  tentativeDate: string | null;
  assigneeOptions: AssigneeOption[];
  canManage: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(tentativeDate ?? "");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [decision, setDecision] = useState<"accept" | "reject">("accept");
  const [reviewComment, setReviewComment] = useState("");

  function run(fn: () => Promise<{ error?: string; ok?: true }>, ok?: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (ok) toast.success(ok);
      router.refresh();
    });
  }

  function openReview(d: "accept" | "reject") {
    setDecision(d);
    setReviewComment("");
    setReviewOpen(true);
  }

  function submitReview() {
    startTransition(async () => {
      const res = await reviewFeature(issueId, decision, reviewComment);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setReviewOpen(false);
      toast.success(decision === "accept" ? "Accepted." : "Rejected.");
      router.refresh();
    });
  }

  const isFeatureReview = type === "feature" && status === "pending_review";
  const isClosed = status === "completed" || status === "rejected";

  // value -> label map so the trigger shows the name, not the raw value.
  const assigneeItems: Record<string, string> = {
    [UNASSIGNED_VALUE]: "Unassigned",
    ...Object.fromEntries(assigneeOptions.map((o) => [o.value, o.label])),
  };

  // Nothing actionable for this user.
  if (!canManage) return null;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Manage</h2>

      {/* Feature accept/reject */}
      {isFeatureReview && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => openReview("accept")}
            disabled={pending}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => openReview("reject")}
            disabled={pending}
          >
            Reject
          </Button>
        </div>
      )}

      {/* Complete / reopen */}
      <div className="flex flex-wrap gap-2">
        {!isClosed && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() => markComplete(issueId), "Marked as completed.")
            }
          >
            Mark complete
          </Button>
        )}
        {isClosed && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => reopenIssue(issueId), "Reopened.")}
          >
            Reopen
          </Button>
        )}
      </div>

      <Separator />

      {/* Assignee — admin only */}
      {isAdmin && (
        <div className="space-y-2">
          <Label>Assigned to</Label>
          <Select
            items={assigneeItems}
            value={assignmentValue}
            onValueChange={(v) =>
              run(
                () => assignIssue(issueId, v === UNASSIGNED_VALUE ? null : v),
                "Assignee updated.",
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
              {assigneeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tentative completion date */}
      <div className="space-y-2">
        <Label htmlFor="tentative">Tentative completion</Label>
        <div className="flex gap-2">
          <Input
            id="tentative"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(
                () => setTentativeDate(issueId, date || null),
                "Date updated.",
              )
            }
          >
            Save
          </Button>
        </div>
      </div>

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "accept"
                ? "Accept feature request"
                : "Reject feature request"}
            </DialogTitle>
            <DialogDescription>
              {decision === "accept"
                ? "Optionally add a note about the approval."
                : "A reason is required when rejecting."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder={
              decision === "accept"
                ? "Optional note…"
                : "Why is this being rejected?"
            }
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant={decision === "reject" ? "destructive" : "default"}
              onClick={submitReview}
              disabled={pending}
            >
              {decision === "accept" ? "Accept" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

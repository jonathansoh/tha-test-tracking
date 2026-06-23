"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { reviewFeature } from "@/app/(app)/issues/[id]/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Admin-only inline approve (✓) / reject (✗) for a pending feature request. */
export function DashboardReviewActions({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState("");

  function approve() {
    startTransition(async () => {
      const res = await reviewFeature(issueId, "accept", "");
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Accepted.");
      router.refresh();
    });
  }

  function submitReject() {
    startTransition(async () => {
      const res = await reviewFeature(issueId, "reject", comment);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setRejectOpen(false);
      setComment("");
      toast.success("Rejected.");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
        title="Approve"
        aria-label="Approve"
        disabled={pending}
        onClick={approve}
      >
        <Check className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        title="Reject"
        aria-label="Reject"
        disabled={pending}
        onClick={() => setRejectOpen(true)}
      >
        <X className="size-4" />
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject feature request</DialogTitle>
            <DialogDescription>
              A reason is required when rejecting.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Why is this being rejected?"
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitReject}
              disabled={pending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

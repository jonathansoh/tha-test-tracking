"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { addComment } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ issueId }: { issueId: string }) {
  const action = addComment.bind(null, issueId);
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <Textarea
        name="body"
        placeholder="Add a comment…"
        rows={3}
        required
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </form>
  );
}

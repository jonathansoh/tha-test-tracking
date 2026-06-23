"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bug, Lightbulb, X, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createIssue } from "./actions";
import {
  MEDIA_BUCKET,
  MAX_FILE_BYTES,
  MAX_FILE_MB,
  fileKind,
} from "@/lib/constants";
import type { IssueType } from "@/lib/types";
import { UNASSIGNED_VALUE, type AssigneeOption } from "@/lib/assignee-utils";
import { cn } from "@/lib/utils";
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

export function NewIssueForm({
  assigneeOptions,
}: {
  assigneeOptions: AssigneeOption[];
}) {
  const router = useRouter();
  const [type, setType] = useState<IssueType>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(UNASSIGNED_VALUE);
  const [tentativeDate, setTentativeDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    for (const f of picked) {
      if (!fileKind(f.type)) {
        toast.error(`${f.name}: only images and videos are allowed.`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`${f.name}: exceeds the ${MAX_FILE_MB} MB limit.`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("A comment is required.");
      return;
    }
    setSubmitting(true);

    const supabase = createClient();
    const id = crypto.randomUUID();
    const uploaded: {
      path: string;
      file_type: "image" | "video";
      mime_type: string;
      file_name: string;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const kind = fileKind(f.type)!;
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${id}/${Date.now()}-${i}-${safe}`;
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, f, { contentType: f.type, upsert: false });
      if (error) {
        toast.error(`Upload failed for ${f.name}.`);
        setSubmitting(false);
        return;
      }
      uploaded.push({
        path,
        file_type: kind,
        mime_type: f.type,
        file_name: f.name,
      });
    }

    const result = await createIssue({
      id,
      type,
      title,
      description,
      assignedTo: assignedTo === UNASSIGNED_VALUE ? null : assignedTo,
      tentativeDate: tentativeDate || null,
      attachments: uploaded,
    });

    if ("error" in result) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    toast.success("Issue raised.");
    router.push(`/issues/${result.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Type */}
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <TypeOption
            active={type === "bug"}
            onClick={() => setType("bug")}
            icon={<Bug className="size-4" />}
            label="Bug"
          />
          <TypeOption
            active={type === "feature"}
            onClick={() => setType("feature")}
            icon={<Lightbulb className="size-4" />}
            label="Feature Request"
          />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary"
          maxLength={200}
        />
      </div>

      {/* Description / comment (required) */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Comment <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the bug or the feature you'd like…"
          rows={5}
          required
        />
      </div>

      {/* Assignee + tentative date */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Assign to <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select
            items={{
              [UNASSIGNED_VALUE]: "Unassigned",
              ...Object.fromEntries(
                assigneeOptions.map((o) => [o.value, o.label]),
              ),
            }}
            value={assignedTo}
            onValueChange={(v) => setAssignedTo(v ?? UNASSIGNED_VALUE)}
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

        <div className="space-y-2">
          <Label htmlFor="tentativeDate">
            Tentative completion{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="tentativeDate"
            type="date"
            value={tentativeDate}
            onChange={(e) => setTentativeDate(e.target.value)}
          />
        </div>
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <Label htmlFor="files">
          Images / videos{" "}
          <span className="text-muted-foreground">
            (optional, max {MAX_FILE_MB} MB each)
          </span>
        </Label>
        <label
          htmlFor="files"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground hover:bg-muted/50"
        >
          <Paperclip className="size-4" />
          Click to add files
        </label>
        <input
          id="files"
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={onPickFiles}
        />
        {files.length > 0 && (
          <ul className="space-y-1">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm"
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TypeOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/5 text-foreground"
          : "border-input text-muted-foreground hover:bg-muted/50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

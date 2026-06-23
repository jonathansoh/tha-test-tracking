"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  MEDIA_BUCKET,
  MAX_FILE_BYTES,
  MAX_FILE_MB,
  fileKind,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { addAttachments } from "./actions";

/** Lets any signed-in user attach more images/videos to an existing issue. */
export function AddAttachments({ issueId }: { issueId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    // Validate up front.
    for (const f of files) {
      if (!fileKind(f.type)) {
        toast.error(`${f.name}: only images and videos are allowed.`);
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`${f.name}: exceeds the ${MAX_FILE_MB} MB limit.`);
        return;
      }
    }

    setUploading(true);
    const supabase = createClient();
    const uploaded: {
      path: string;
      file_type: "image" | "video";
      mime_type: string;
      file_name: string;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${issueId}/${Date.now()}-${i}-${safe}`;
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, f, { contentType: f.type, upsert: false });
      if (error) {
        toast.error(`Upload failed for ${f.name}.`);
        setUploading(false);
        return;
      }
      uploaded.push({
        path,
        file_type: fileKind(f.type)!,
        mime_type: f.type,
        file_name: f.name,
      });
    }

    const res = await addAttachments(issueId, uploaded);
    setUploading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(uploaded.length > 1 ? "Files added." : "File added.");
    router.refresh();
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onPick}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-4" />
        {uploading ? "Uploading…" : "Add image / video"}
      </Button>
    </div>
  );
}

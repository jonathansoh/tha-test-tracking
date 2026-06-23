"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  file_type: "image" | "video";
  url: string;
  file_name: string | null;
};

const MIN = 1;
const MAX = 5;
const STEP = 0.5;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, +n.toFixed(2)));

export function AttachmentGallery({ attachments }: { attachments: Item[] }) {
  const [active, setActive] = useState<Item | null>(null);
  const [scale, setScale] = useState(1);

  function open(item: Item) {
    setActive(item);
    setScale(1);
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {attachments.map((a) => (
          <div key={a.id} className="overflow-hidden rounded-md border">
            {a.file_type === "image" ? (
              <button
                type="button"
                onClick={() => open(a)}
                className="block w-full cursor-zoom-in"
                title="Click to enlarge"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.file_name ?? "attachment"}
                  className="h-48 w-full bg-muted object-contain"
                />
              </button>
            ) : (
              <video src={a.url} controls className="h-48 w-full bg-black" />
            )}
            <p className="truncate px-2 py-1 text-xs text-muted-foreground">
              {a.file_name}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent
          className="flex max-h-[95vh] w-[96vw] max-w-[96vw] flex-col gap-0 p-0 sm:max-w-[96vw]"
          showCloseButton
        >
          <DialogTitle className="sr-only">
            {active?.file_name ?? "Attachment preview"}
          </DialogTitle>

          <div className="flex items-center gap-1 border-b p-2">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Zoom out"
              disabled={scale <= MIN}
              onClick={() => setScale((s) => clamp(s - STEP))}
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Zoom in"
              disabled={scale >= MAX}
              onClick={() => setScale((s) => clamp(s + STEP))}
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Reset zoom"
              onClick={() => setScale(1)}
            >
              <RotateCcw className="size-4" />
            </Button>
            {active && (
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto mr-8"
                title="Open original in new tab"
              >
                <Button size="icon" variant="ghost" className="size-8">
                  <ExternalLink className="size-4" />
                </Button>
              </a>
            )}
          </div>

          {/* Scrollable viewport — when zoomed, scroll to pan. */}
          <div className="overflow-auto bg-muted/40">
            {active && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.url}
                alt={active.file_name ?? "attachment"}
                onClick={() => setScale((s) => (s > 1 ? 1 : 2.5))}
                style={{
                  width: `${scale * 100}%`,
                  maxWidth: "none",
                  cursor: scale > 1 ? "zoom-out" : "zoom-in",
                }}
                className="mx-auto block select-none"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

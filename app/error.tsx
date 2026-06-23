"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console and Vercel client logs. The matching
    // server-side error is logged via lib/logger.ts with its digest.
    console.error("[app error]", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. You can try again. If it keeps happening,
        share this reference with an admin:
      </p>
      {error.digest && (
        <code className="rounded bg-muted px-2 py-1 text-xs">{error.digest}</code>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

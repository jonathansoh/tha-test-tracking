import "server-only";

type LogContext = Record<string, unknown>;

/**
 * Structured server-side error logging. Emits a single-line JSON record that
 * shows up cleanly in Vercel runtime logs (`vercel logs <deployment>`), the
 * local dev terminal, or anywhere stdout/stderr is collected.
 *
 * Usage:
 *   const { error } = await supabase.from("issues").insert(...);
 *   if (error) { logError("issues.create", error, { userId }); return { error: "…" }; }
 */
export function logError(
  scope: string,
  error: unknown,
  context: LogContext = {},
): void {
  const record: LogContext = {
    level: "error",
    scope,
    message:
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error),
    at: new Date().toISOString(),
    ...context,
  };
  if (error instanceof Error && error.stack) record.stack = error.stack;
  console.error(JSON.stringify(record));
}

/** Structured non-error events (e.g. auth failures worth tracing). */
export function logWarn(
  scope: string,
  message: string,
  context: LogContext = {},
): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      scope,
      message,
      at: new Date().toISOString(),
      ...context,
    }),
  );
}

/** Date/time formatting in Kuala Lumpur time (Asia/Kuala_Lumpur, UTC+8). */

const KUL_TZ = "Asia/Kuala_Lumpur";

/** e.g. "23 Jun 2026, 04:18 PM" */
export function formatKulDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: KUL_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

/** e.g. "23 Jun 2026" */
export function formatKulDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: KUL_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

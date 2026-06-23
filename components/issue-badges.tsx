import { Badge } from "@/components/ui/badge";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  type IssueStatus,
  type IssueType,
} from "@/lib/types";

export function TypeBadge({ type }: { type: IssueType }) {
  return (
    <Badge variant={type === "bug" ? "destructive" : "default"}>
      {TYPE_LABELS[type]}
    </Badge>
  );
}

const STATUS_STYLES: Record<IssueStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  pending_review:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  in_progress:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

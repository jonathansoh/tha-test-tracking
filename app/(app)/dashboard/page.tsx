import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatKulDate, formatKulDateTime } from "@/lib/time";
import type { Issue, IssueStatus } from "@/lib/types";
import { StatusBadge, TypeBadge } from "@/components/issue-badges";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard — Issue Tracker" };

type TabKey = IssueStatus | "all";

const TABS: { key: TabKey; label: string }[] = [
  { key: "in_progress", label: "In Progress" },
  { key: "pending_review", label: "Pending Review" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const SELECT = `
  *,
  raised_by_profile:profiles!issues_raised_by_fkey(id,username),
  assigned_to_profile:profiles!issues_assigned_to_fkey(id,username)
`;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: TabKey =
    TABS.find((t) => t.key === tabParam)?.key ?? "in_progress";

  const supabase = await createClient();

  let query = supabase
    .from("issues")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (tab !== "all") query = query.eq("status", tab);

  const [{ data: issues }, { data: statusRows }] = await Promise.all([
    query,
    supabase.from("issues").select("status"),
  ]);

  const counts: Record<string, number> = {};
  for (const row of statusRows ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  counts.all = statusRows?.length ?? 0;

  const list = (issues ?? []) as unknown as Issue[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/issues/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Raise Issue
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/dashboard?tab=${t.key}`}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {counts[t.key] ?? 0}
              </span>
            </Link>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No issues here yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Summary</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Raised by</th>
                <th className="px-3 py-2 font-medium">Raised</th>
                <th className="px-3 py-2 font-medium">Assigned</th>
                <th className="px-3 py-2 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {list.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-b last:border-0 hover:bg-muted/40"
                >
                  <td className="px-3 py-2">
                    <TypeBadge type={issue.type} />
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    <Link
                      href={`/issues/${issue.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {issue.title || issue.description}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {issue.raised_by_profile?.username ?? "—"}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2 text-muted-foreground"
                    title={formatKulDateTime(issue.created_at)}
                  >
                    {formatKulDate(issue.created_at)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {issue.assigned_to_profile?.username ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {issue.tentative_completion_date
                      ? formatKulDate(issue.tentative_completion_date)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

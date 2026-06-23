// Pure assignee helpers — safe to import from client or server code.

export const UNASSIGNED_VALUE = "__unassigned__";

export type AssigneeOption = {
  value: string; // "user:<id>" | "invite:<id>"
  label: string;
  pending: boolean;
};

export type ParsedAssignee =
  | { kind: "none" }
  | { kind: "user"; id: string }
  | { kind: "invite"; id: string };

export function parseAssignee(value: string | null): ParsedAssignee {
  if (!value || value === UNASSIGNED_VALUE) return { kind: "none" };
  if (value.startsWith("user:")) return { kind: "user", id: value.slice(5) };
  if (value.startsWith("invite:")) return { kind: "invite", id: value.slice(7) };
  return { kind: "none" };
}

/** The Select value representing an issue's current assignment. */
export function assignmentValue(issue: {
  assigned_to: string | null;
  assigned_invite_id: string | null;
}): string {
  if (issue.assigned_to) return `user:${issue.assigned_to}`;
  if (issue.assigned_invite_id) return `invite:${issue.assigned_invite_id}`;
  return UNASSIGNED_VALUE;
}

export type Role = "admin" | "user";
export type IssueType = "bug" | "feature";
export type IssueStatus =
  | "new"
  | "pending_review"
  | "in_progress"
  | "completed"
  | "rejected";

export interface Profile {
  id: string;
  username: string;
  role: Role;
  created_at: string;
}

export interface Attachment {
  id: string;
  issue_id: string;
  storage_path: string;
  file_type: "image" | "video";
  mime_type: string | null;
  file_name: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Pick<Profile, "id" | "username"> | null;
}

export interface Issue {
  id: string;
  type: IssueType;
  title: string | null;
  description: string;
  status: IssueStatus;
  raised_by: string;
  assigned_to: string | null;
  tentative_completion_date: string | null;
  completed_at: string | null;
  review_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  raised_by_profile?: Pick<Profile, "id" | "username"> | null;
  assigned_to_profile?: Pick<Profile, "id" | "username"> | null;
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  new: "New",
  pending_review: "Pending Review",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

export const TYPE_LABELS: Record<IssueType, string> = {
  bug: "Bug",
  feature: "Feature Request",
};

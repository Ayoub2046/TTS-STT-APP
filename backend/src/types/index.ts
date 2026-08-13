export type Role = "contributor" | "reviewer" | "admin";

export type TranslationStatus =
  | "draft"
  | "pending"
  | "under_review"
  | "correction_requested"
  | "approved"
  | "rejected"
  | "published";

export type ReviewDecision = "approve" | "reject" | "request_correction";

export type Language = "maay" | "maxaa" | "somali";

export type DashboardStats = {
  draft: number;
  submitted: number;
  approved: number;
  pending: number;
  rejected: number;
  correctionRequested: number;
  approvalRate: number;
};
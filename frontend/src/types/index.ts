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
export type Direction = "maay-to-maxaa" | "maxaa-to-maay";

export const DOMAINS = [
  "general",
  "education",
  "health",
  "agriculture",
  "business",
  "technology",
  "government",
  "culture",
  "religion",
  "daily_conversation",
  "news",
  "environment",
  "science",
  "legal",
] as const;

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  native_language?: string;
  experience_level?: string;
  is_active: boolean;
  created_at: string;
}

export interface ValidationIssue {
  type: string;
  message: string;
  field?: string;
  severity: "error" | "warning";
}

export interface TranslationPair {
  id: string;
  contributor_id: string;
  source_language: Language;
  target_language: Language;
  source_text: string;
  target_text: string;
  domain: string;
  status: TranslationStatus;
  quality_score: number | null;
  validation_flags: ValidationIssue[] | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  profiles?: { full_name: string | null };
}

export interface DashboardStats {
  draft: number;
  submitted: number;
  approved: number;
  pending: number;
  rejected: number;
  correctionRequested: number;
  approvalRate: number;
}

export interface Review {
  id: string;
  translation_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  comment: string | null;
  original_source: string;
  original_target: string;
  corrected_source: string | null;
  corrected_target: string | null;
  quality_score: number | null;
  created_at: string;
  profiles?: { full_name: string | null };
}
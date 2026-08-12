import { api } from "./api";
import { DashboardStats, Profile, Review, TranslationPair, User } from "@/types";

export const authService = {
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    nativeLanguage?: string;
    experienceLevel?: string;
  }) =>
    api.post<{ success: boolean; message: string; data: { id: string } }>(`/api/auth/register`, data),

  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; data: { token: string; user: User } }>(`/api/auth/login`, data),

  me: () => api.get<{ success: boolean; data: User }>(`/api/auth/me`),

  logout: () => api.post<{ success: boolean }>(`/api/auth/logout`),
};

export const translationService = {
  create: (data: {
    sourceLanguage: string;
    targetLanguage: string;
    sourceText: string;
    targetText: string;
    domain: string;
    status?: "pending" | "draft";
  }) =>
    api.post<{
      success: boolean;
      message: string;
      data: { id: string; status: string; validation: { valid: boolean; issues: unknown[] } };
    }>(`/api/translations`, data),

  list: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return api.get<{ success: boolean; data: TranslationPair[]; meta: { total: number } }>(
      `/api/translations?${qs}`
    );
  },

  get: (id: string) =>
    api.get<{ success: boolean; data: TranslationPair }>(`/api/translations/${id}`),

  update: (id: string, data: Partial<TranslationPair>) =>
    api.patch<{ success: boolean; data: TranslationPair }>(`/api/translations/${id}`, data),

  remove: (id: string) =>
    api.delete<{ success: boolean }>(`/api/translations/${id}`),

  myStats: () =>
    api.get<{ success: boolean; data: DashboardStats }>(`/api/translations/stats/mine`),
};

export const reviewService = {
  pending: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return api.get<{ success: boolean; data: TranslationPair[]; meta: { total: number; pendingDisplay: number } }>(
      `/api/reviews/pending?${qs}`
    );
  },
  submit: (id: string, data: { decision: string; comment?: string; correctedSource?: string; correctedTarget?: string; qualityScore?: number }) =>
    api.post<{ success: boolean; data: { id: string; status: string } }>(`/api/reviews/${id}`, data),
  history: (id: string) =>
    api.get<{ success: boolean; data: Review[] }>(`/api/reviews/${id}/history`),
};

export const profileService = {
  list: () =>
    api.get<{ success: boolean; data: Profile[] }>(`/api/admin/users`),
};

export const adminService = {
  stats: () =>
    api.get<{
      success: boolean;
      data: {
        totalUsers: number;
        contributors: number;
        reviewers: number;
        totalSentences: number;
        approved: number;
        rejected: number;
        pending: number;
        qualityGte4: number;
        totalReviews: number;
      };
    }>(`/api/admin/stats`),
  users: () => api.get<{ success: boolean; data: Profile[] }>(`/api/admin/users`),
  updateUser: (id: string, data: { role?: string; isActive?: boolean; fullName?: string }) =>
    api.patch<{ success: boolean; data: Profile }>(`/api/admin/users/${id}`, data),
  auditLogs: () =>
    api.get<{
      success: boolean;
      data: Array<{ id: number; action: string; entity_type: string; metadata: unknown; created_at: string; profiles?: { full_name: string | null } }>;
    }>(`/api/admin/audit-logs`),
};

export const datasetService = {
  stats: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get<{
      success: boolean;
      data: {
        total: number;
        approved: number;
        approvedPercent: number;
        pending: number;
        rejected: number;
        qualityOk: number;
        qualityOkPercent: number;
        maayToMaxaa: number;
        maxaaToMaay: number;
        domains: Record<string, number>;
      };
    }>(`/api/datasets/stats${qs ? `?${qs}` : ""}`);
  },
  validate: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.post<{ success: boolean; data: { totalRecords: number; cleanRecords: number; duplicates: number; issues: unknown[] } }>(
      `/api/datasets/validate${qs ? `?${qs}` : ""}`
    );
  },
};

export const huggingfaceService = {
  status: () =>
    api.get<{
      success: boolean;
      data: { configured: boolean; repoId: string; approvedRecords: number; qualityGte4: number; readyToPush: boolean };
    }>(`/api/huggingface/status`),
  preview: () =>
    api.post<{
      success: boolean;
      data: { pairs: unknown[]; splits: { train: number; validation: number; test: number }; stats: Record<string, number | string> };
    }>(`/api/huggingface/preview`),
  push: (data: { datasetId: string; version: string; commitMessage: string }) =>
    api.post<{ success: boolean; data: { repoId: string; revision: string; splits: { train: number; validation: number; test: number }; message: string } }>(
      `/api/huggingface/push`,
      data
    ),
  history: () =>
    api.get<{
      success: boolean;
      data: Array<{ id: string; repo_id: string; commit_id: string | null; commit_message: string; status: string; pushed_at: string; profiles?: { full_name: string | null } }>;
    }>(`/api/huggingface/history`),
};
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2).max(120),
  nativeLanguage: z.enum(["maay", "maxaa", "bilingual", "other"]).default("other"),
  experienceLevel: z.enum(["native", "translator", "reviewer", "learner"]).default("learner"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  languagePreference: z.enum(["maay", "maxaa"]).optional(),
  nativeLanguage: z.enum(["maay", "maxaa", "bilingual", "other"]).optional(),
  experienceLevel: z.enum(["native", "translator", "reviewer", "learner"]).optional(),
});
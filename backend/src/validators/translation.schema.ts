import { z } from "zod";

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

export const translationSchema = z.object({
  sourceLanguage: z.enum(["maay", "maxaa", "somali"]),
  targetLanguage: z.enum(["maay", "maxaa", "somali"]),
  sourceText: z.string().min(1).max(2000),
  targetText: z.string().min(1).max(2000),
  domain: z.enum(DOMAINS).default("general"),
  status: z.enum(["pending", "draft"]).default("pending"),
});

export const translationUpdateSchema = translationSchema.partial();

const idSchema = z.string().uuid();

export const idParamSchema = z.object({
  id: idSchema,
});
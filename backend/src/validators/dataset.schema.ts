import { z } from "zod";

export const datasetCreateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  sourceLanguage: z.enum(["maay", "maxaa", "somali"]),
  targetLanguage: z.enum(["maay", "maxaa", "somali"]),
});

export const pushSchema = z.object({
  datasetId: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be semver, e.g. 1.0.0"),
  commitMessage: z.string().max(500).default("Release Maay-Maxaa dataset"),
  qualityThreshold: z.number().int().min(1).max(5).default(4),
  includeReverse: z.boolean().default(true),
});
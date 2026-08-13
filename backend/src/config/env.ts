import { z } from "zod";
import dotenv from "dotenv";

import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().default("https://placeholder.supabase.co"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("placeholder_service_role_key"),
  SUPABASE_ANON_KEY: z.string().default("placeholder_anon_key"),
  JWT_SECRET: z.string().min(1).default("dev-only-change-me"),
  HF_TOKEN: z.string().optional(),
  HF_DATASET_REPO: z.string().default("SomaliDatasets/maay-maxaa-translation"),
  CORS_ORIGINS: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn("⚠️ Warning: Environment variables incomplete:", parsed.error.flatten().fieldErrors);
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: "production" as const,
      PORT: 4000,
      SUPABASE_URL: process.env.SUPABASE_URL || "https://placeholder.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder_service_role_key",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "placeholder_anon_key",
      JWT_SECRET: process.env.JWT_SECRET || "dev-only-change-me",
      HF_TOKEN: process.env.HF_TOKEN,
      HF_DATASET_REPO: process.env.HF_DATASET_REPO || "SomaliDatasets/maay-maxaa-translation",
      CORS_ORIGINS: process.env.CORS_ORIGINS || "*",
      RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
      RATE_LIMIT_MAX: 1000,
    };
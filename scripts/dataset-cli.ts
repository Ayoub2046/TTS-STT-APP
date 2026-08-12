/**
 * Shared engine for the standalone dataset CLI scripts.
 * Reads approved translations from Supabase and builds/publishes files.
 *
 * Usage:
 *   node scripts/dataset-cli.ts <command> [options]
 *
 * Commands:
 *   validate   — run automatic validation over approved records
 *   generate   — build train/validation/test files into ./output or ./exports/<version>
 *   split      — print the split distribution
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  buildDatasetPairs,
  splitDataset,
  toJsonl,
  toCsv,
  generateStats,
  generateDatasetCard,
  DatasetPair,
} from "../backend/src/services/dataset.service.js";
import {
  validateTranslation,
  normalizeSentence,
} from "../backend/src/services/validation.service.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});
const env = envSchema.parse(process.env);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

interface ApprovedRow {
  id: string;
  source_text: string;
  target_text: string;
  source_language: string;
  target_language: string;
  quality_score: number | null;
}

async function fetchApproved(qualityThreshold = 4): Promise<ApprovedRow[]> {
  const { data, error } = await supabase
    .from("translation_pairs")
    .select("id, source_text, target_text, source_language, target_language, quality_score")
    .eq("status", "approved")
    .gte("quality_score", qualityThreshold)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ApprovedRow[];
}

const [command] = process.argv.slice(2);

async function main() {
  const rows = await fetchApproved();
  console.log(`Approved records fetched: ${rows.length}`);

  switch (command) {
    case "validate": {
      let errors = 0;
      let warnings = 0;
      const seen = new Set<string>();
      const duplicates: string[] = [];

      for (const row of rows) {
        const src = normalizeSentence(row.source_text);
        const result = validateTranslation({
          sourceText: row.source_text,
          targetText: row.target_text,
          existingSources: [],
        });
        errors += result.issues.filter((i) => i.severity === "error").length;
        warnings += result.issues.filter((i) => i.severity === "warning").length;

        const key = src.toLowerCase();
        if (seen.has(key)) duplicates.push(src);
        seen.add(key);
      }

      console.log(`\nValidation results:`);
      console.log(`  Errors:    ${errors}`);
      console.log(`  Warnings:  ${warnings}`);
      console.log(`  Duplicates (exact): ${duplicates.length}`);
      console.log(errors > 0 ? "❌ Dataset has blocking issues." : "✅ Dataset is valid.");
      break;
    }

    case "split": {
      const pairs = buildDatasetPairs(rows);
      const splits = splitDataset(pairs);
      console.log(`\n${pairs.length} pairs (forward + reverse):`);
      console.log(`  train      ${splits.train.length}`);
      console.log(`  validation ${splits.validation.length}`);
      console.log(`  test       ${splits.test.length}`);
      break;
    }

    case "generate": {
      const pairs = buildDatasetPairs(rows);
      const splits = splitDataset(pairs);
      const stats = generateStats(pairs);
      const outDir = join(process.cwd(), "output");
      mkdirSync(join(outDir, "data"), { recursive: true });
      mkdirSync(join(outDir, "metadata"), { recursive: true });

      writeFileSync(join(outDir, "data", "train.jsonl"), toJsonl(splits.train));
      writeFileSync(join(outDir, "data", "validation.jsonl"), toJsonl(splits.validation));
      writeFileSync(join(outDir, "data", "test.jsonl"), toJsonl(splits.test));
      writeFileSync(join(outDir, "data", "train.csv"), toCsv(splits.train));
      writeFileSync(join(outDir, "data", "validation.csv"), toCsv(splits.validation));
      writeFileSync(join(outDir, "data", "test.csv"), toCsv(splits.test));
      writeFileSync(join(outDir, "README.md"), generateDatasetCard(stats));
      writeFileSync(join(outDir, "metadata", "dataset_stats.json"), JSON.stringify(stats, null, 2));

      console.log(`\nWrote ${pairs.length} pairs to ./output/`);
      console.log(`  train       ${splits.train.length}`);
      console.log(`  validation  ${splits.validation.length}`);
      console.log(`  test        ${splits.test.length}`);
      break;
    }

    default:
      console.log("Usage: node scripts/dataset-cli.ts <validate|generate|split>");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
export interface DatasetPair {
  source: string;
  target: string;
  source_lang: string;
  target_lang: string;
}

export interface DatasetSplits {
  train: DatasetPair[];
  validation: DatasetPair[];
  test: DatasetPair[];
}

/**
 * Build canonical Maay ↔ Maxaa pairs.
 * For each approved translation_pair, we emit the forward direction. When the
 * stored record is the primary maay->maxaa direction, we can also emit the
 * reverse (maxaa->maay) so the dataset trains both directions.
 */
export function buildDatasetPairs(
  rows: Array<{
    source_text: string;
    target_text: string;
    source_language: string;
    target_language: string;
  }>,
  includeReverse = true
): DatasetPair[] {
  const pairs: DatasetPair[] = [];

  for (const row of rows) {
    const forward: DatasetPair = {
      source: row.source_text,
      target: row.target_text,
      source_lang: row.source_language,
      target_lang: row.target_language,
    };
    pairs.push(forward);

    if (includeReverse) {
      pairs.push({
        source: row.target_text,
        target: row.source_text,
        source_lang: row.target_language,
        target_lang: row.source_language,
      });
    }
  }

  return dedupePairs(pairs);
}

/** Remove exact duplicate pairs (same source+target+langs). */
export function dedupePairs(pairs: DatasetPair[]): DatasetPair[] {
  const seen = new Set<string>();
  const out: DatasetPair[] = [];
  for (const p of pairs) {
    const key = `${p.source_lang}|${p.target_lang}|${p.source.toLowerCase()}|${p.target.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/** Deterministic seeded split: 80% train, 10% validation, 10% test. */
export function splitDataset(pairs: DatasetPair[], trainRatio = 0.8, valRatio = 0.1): DatasetSplits {
  const train: DatasetPair[] = [];
  const validation: DatasetPair[] = [];
  const test: DatasetPair[] = [];

  pairs.forEach((p) => {
    const r = hashKey(p) / 4294967295;
    if (r < trainRatio) train.push(p);
    else if (r < trainRatio + valRatio) validation.push(p);
    else test.push(p);
  });

  return { train, validation, test };
}

function hashKey(p: DatasetPair): number {
  const str = `${p.source_lang}|${p.target_lang}|${p.source}|${p.target}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function toJsonl(pairs: DatasetPair[]): string {
  return pairs.map((p) => JSON.stringify(p)).join("\n");
}

export function toCsv(pairs: DatasetPair[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return ["source,target,source_lang,target_lang", ...pairs.map((p) => `${esc(p.source)},${esc(p.target)},${p.source_lang},${p.target_lang}`)].join("\n");
}

export function generateStats(pairs: DatasetPair[]): Record<string, number | string> {
  const total = pairs.length;
  const maayToMaxaa = pairs.filter((p) => p.source_lang === "maay" && p.target_lang === "maxaa").length;
  const maxaaToMaay = pairs.filter((p) => p.source_lang === "maxaa" && p.target_lang === "maay").length;
  const avgSourceLen = total ? Math.round(pairs.reduce((s, p) => s + p.source.length, 0) / total) : 0;
  const avgTargetLen = total ? Math.round(pairs.reduce((s, p) => s + p.target.length, 0) / total) : 0;
  return {
    total_records: total,
    maay_to_maxaa: maayToMaxaa,
    maxaa_to_maay: maxaaToMaay,
    avg_source_length: avgSourceLen,
    avg_target_length: avgTargetLen,
    version: "0.1.0",
  };
}

export function generateDatasetCard(stats: Record<string, number | string>): string {
  return `# MaayMaxaa Translation Dataset

A collaborative parallel corpus for Maay ↔ Maxaa machine translation.

## Stats

| Metric | Value |
|--------|-------|
| Total records | ${stats.total_records} |
| Maay → Maxaa | ${stats.maay_to_maxaa} |
| Maxaa → Maay | ${stats.maxaa_to_maay} |
| Avg source length | ${stats.avg_source_length} |
| Avg target length | ${stats.avg_target_length} |
| Version | ${stats.version} |

## Languages

- Maay (Maay Maay) — Southern Somali dialect
- Maxaa-tiri (Maxaa Soomaali) — Standard Somali

## Columns

- \`source\`: source sentence
- \`target\`: target sentence
- \`source_lang\`: \`maay\` or \`maxaa\`
- \`target_lang\`: \`maay\` or \`maxaa\`

## License

This dataset is released for research and open development of Somali language technology.
`;
}
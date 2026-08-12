# Hugging Face Publishing

## Security (read this first)

⚠️ **Never** put `HF_TOKEN` in the React frontend (no `VITE_HF_*`).

Wrong:

```env
# frontend/.env — DO NOT
VITE_HF_TOKEN=hf_xxxxx
```

Correct — token lives only on the backend:

```env
# backend/.env
HF_TOKEN=hf_xxxxxxxxx
HF_DATASET_REPO=Ayoubadanabdi/Maay-Maxaa-Translation
```

The push flow is admin-only:

```
Admin → POST /api/huggingface/push → requireAuth → requireRole("admin")
  → fetch approved records (quality ≥ 4)
  → validate + deduplicate
  → split 80/10/10
  → generate train/validation/test JSONL + CSV
  → generate README (dataset card) + dataset_stats.json
  → upload to HF via /api/datasets/<repo>/upload (single commit)
  → store dataset_versions + hf_push_logs + audit_log
```

## Recommended Repository

```
Ayoubadanabdi/Maay-Maxaa-Translation
```

(or an org repo like `Somali-AI-Research/Maay-Maxaa-Translation` once you create an org.)

Keep it **private** during development, make it **public** when you're ready.

## Repository Layout

```
maay-maxaa-translation/
├── README.md                  ← dataset card
├── data/
│   ├── train.jsonl            ← 80%
│   ├── validation.jsonl       ← 10%
│   ├── test.jsonl             ← 10%
│   ├── train.csv
│   ├── validation.csv
│   └── test.csv
├── metadata/
│   ├── dataset_stats.json
│   └── sources.json
└── LICENSE
```

## Record Format (clean, no PII)

```json
{ "source": "Maay sentence", "target": "Maxaa sentence", "source_lang": "maay", "target_lang": "maxaa" }
{ "source": "Maxaa sentence", "target": "Maay sentence", "source_lang": "maxaa", "target_lang": "maay" }
```

Both directions are emitted from each approved pair so a single model can learn both.

## Token Requirements

- Token needs **write** permission on the dataset repo (create via https://huggingface.co/settings/tokens).
- `HF_DATASET_REPO` must exist or the upload will fail — create it once in the HF UI first.

## Versioning

Every push records a semver version (e.g. `1.0.0`). HF itself keeps revision history, and
`hf_push_logs` + `dataset_versions` give you an auditable local record of every release.

## CLI Alternative

The dataset can also be generated locally without HF:

```bash
node scripts/dataset-cli.ts generate   # writes ./output with train/val/test files
node scripts/dataset-cli.ts validate   # runs automatic validation
node scripts/dataset-cli.ts split      # prints split sizes
```

Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in the environment.

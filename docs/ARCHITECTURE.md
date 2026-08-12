# Architecture

## System Overview

```
                     ┌───────────────────────┐
                     │       React PWA        │
                     │ Contributor / Reviewer │
                     │ Admin Dashboards       │
                     └───────────┬───────────┘
                                 │ REST API / HTTPS
                     ┌───────────▼───────────┐
                     │      Node.js API       │
                     │      Express.js        │
                     │ Auth · Validation      │
                     │ Review · Dataset Mgmt  │
                     │ Admin · HF Publisher   │
                     └───────────┬───────────┘
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
  ┌───────▼───────┐      ┌───────▼───────┐      ┌───────▼────────┐
  │   Supabase    │      │  Supabase     │      │  Hugging Face  │
  │  PostgreSQL   │      │  Storage      │      │  Dataset Hub   │
  │ users, pairs, │      │ exports,      │      │ train.jsonl    │
  │ reviews, logs │      │ audio         │      │ validation/test│
  └───────────────┘      └───────────────┘      └────────────────┘
```

## Roles & Auth Flow

```
React token (localStorage) ──► Bearer header ──► requireAuth (Supabase verify)
                                                        │
                                             requireRole("admin" | "reviewer")
                                                        │
                                             validateBody (Zod) → controller → Supabase
```

## Key Modules (backend)

| Module | Responsibility |
|--------|----------------|
| `validation.service` | Automatic validation: empty / short / duplicate / untranslated |
| `dataset.service` | Pair builder (forward + reverse), dedupe, 80/10/10 split, JSONL/CSV, dataset card |
| `huggingface.service` | Fetch approved rows, build files, upload to HF Hub |
| `audit.service` | Write `audit_logs` on every write operation |
| `middleware/auth` | JWT auth + role guards |
| `middleware/validation` | Zod body/params/query validation |

## Dataset Pipeline

```
Approved records
  → remove duplicates
  → normalize whitespace
  → quality filter (≥ threshold, default 4)
  → reverse direction expansion (Maay↔Maxaa)
  → split train 80% / validation 10% / test 10%
  → JSONL + CSV + Dataset Card + stats
  → push to Hugging Face (admin only)
```

Every push stores a `dataset_versions` row + `hf_push_logs` entry + audit log, so the full
version history is reproducible.
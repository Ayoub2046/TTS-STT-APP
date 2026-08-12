# Dataset Guide

## Record model

| Field | Description |
|-------|-------------|
| `source` | source sentence (Maay or Maxaa) |
| `target` | target sentence |
| `source_lang` / `target_lang` | `maay` or `maxaa` |
| `domain` | general, education, health, agriculture, business, technology, government, culture, religion, daily_conversation, news, environment, science, legal |

Internal DB record keeps full provenance (`contributor_id`, `reviewer_id`, `quality_score`,
`status`, timestamps). **Only clean fields are exported / published** — never emails or PII.

## Directions

Store one source-of-truth pair, emit both directions:

```
Maay: "Waa kuma magacaaga?"
Maxaa: "Waa maxay magacaagu?"
```

Dataset builder emits:
- `maay → maxaa`
- `maxaa → maay`

## Quality score

| Score | Meaning |
|-------|---------|
| 5 | Excellent |
| 4 | Good |
| 3 | Acceptable |
| 2 | Needs correction |
| 1 | Incorrect |

Default export threshold: `quality_score >= 4`. Admin can raise/lower it via API query params.

## Automatic validation

Runs on create and update:

- Empty source / target → error
- Text shorter than 2 chars → error
- Exact duplicate source sentence → error
- Source == target (possible untranslated) → **warning** (not rejected — some words/names are shared between dialects)

Validation issues are stored in `validation_flags` per row.

## Train / validation / test split

Deterministic 80 / 10 / 10 split by content hash — identical sentences always land in the
same split, preventing train/test leakage for exact duplicates.

## Contribution guidelines

1. One idea per sentence — keep them short and natural.
2. Translate the meaning, not word-for-word.
3. Use correct dialect: don't mix Maxaa forms into the Maay column.
4. Pick the right domain.
5. Prefer everyday spoken sentences for maximum coverage.
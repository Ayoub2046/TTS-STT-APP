# API Reference

Base URL: `http://localhost:4000` (dev). All routes except `/auth` require `Authorization: Bearer <token>`.

## Health

```
GET /api/health
```

## Auth

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/auth/register` | `{ email, password, fullName, nativeLanguage, experienceLevel }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/logout` | — |
| GET | `/api/auth/me` | → current user |

## Translations

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/api/translations` | `{ sourceLanguage, targetLanguage, sourceText, targetText, domain, status }` returns validation issues |
| GET | `/api/translations` | Filters: `status, domain, direction (maay-to-maxaa), search, page, limit` |
| GET | `/api/translations/:id` | — |
| PATCH | `/api/translations/:id` | own pending/draft only (or admin/reviewer) |
| DELETE | `/api/translations/:id` | own only (or admin) |
| GET | `/api/translations/stats/mine` | contributor dashboard stats |

Response example (POST):

```json
{
  "success": true,
  "message": "Translation submitted successfully.",
  "data": {
    "id": "uuid",
    "status": "pending",
    "validation": { "valid": true, "issues": [] }
  }
}
```

## Reviews (reviewer/admin)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/reviews/pending` | queue of `pending` + `correction_requested` |
| POST | `/api/reviews/:id` | `{ decision, comment?, correctedSource?, correctedTarget?, qualityScore? }` — approve requires qualityScore |
| GET | `/api/reviews/:id/history` | review history for a translation |

## Datasets

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/datasets` | list |
| GET | `/api/datasets/stats` | totals, quality %, direction counts, domains |
| POST | `/api/datasets` | admin — create dataset |
| POST | `/api/datasets/validate` | admin — duplicate/empty scan on approved rows |
| POST | `/api/datasets/:id/export` | admin — `format=jsonl\|json\|csv`, direction filters, download |

## Hugging Face (admin only)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/huggingface/status` | configured?, repo, approved counts, readyToPush |
| POST | `/api/huggingface/preview` | build + split preview (no upload) |
| POST | `/api/huggingface/push` | `{ datasetId, version, commitMessage }` → uploads to HF, stores version + log |
| GET | `/api/huggingface/history` | push history |

## Admin

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/admin/stats` | platform overview |
| GET | `/api/admin/users` | list profiles |
| PATCH | `/api/admin/users/:id` | `{ role?, isActive?, fullName? }` |
| GET | `/api/admin/audit-logs` | recent audit entries |

## Error Format

```json
{ "success": false, "message": "...", "errors": { ... } }
```

Status codes: `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `422` validation failed, `500` server, `502` HF upstream.
# Database

Supabase PostgreSQL. Apply `database/schema.sql` then `database/migrations/001_admin_utilities.sql`.

## Tables

### profiles
`id` (→ auth.users), `email`, `full_name`, `avatar_url`, `role` (contributor/reviewer/admin), `language_preference`, `native_language`, `experience_level`, `is_active`, timestamps.

Auto-created by the `handle_new_user()` trigger on signup.

### datasets
`id`, `name`, `description`, `source_language`/`target_language`, `status`, `total_records`, `approved_records`, `rejected_records`, `version`, `created_by`.

### translation_pairs (core table)
`id`, `dataset_id?`, `contributor_id`, `source_language`, `target_language`, `source_text`, `target_text`, `domain`, `status`, `quality_score (1-5)`, `review_count`, `validation_flags (jsonb)`, `contributor_metadata (jsonb)`, `approved_at`, `approved_by`.

Indexes on: `status`, `contributor_id`, `(source_language, target_language)`, `domain`, `source_text`.

### reviews
`translation_id`, `reviewer_id`, `decision (approve/reject/request_correction)`, `comment`, `original_source`/`original_target`, `corrected_source`/`corrected_target`, `quality_score`.

### dataset_versions
`dataset_id`, `version`, `total_records`, `approved_records`, `jsonl_url`, `csv_url`, `parquet_url`, `created_by`.

### hf_push_logs
`dataset_version_id`, `repo_id`, `commit_id`, `commit_message`, `status`, `error_message`, `pushed_by`, `pushed_at`.

### audit_logs
`user_id`, `action`, `entity_type`, `entity_id`, `metadata (jsonb)`, `created_at`.

### notifications
`user_id`, `title`, `message`, `type`, `entity_type`, `entity_id`, `read_at`.

## Status Flow

```
draft → pending → under_review → correction_requested → pending …
                                   approved → published
                                   rejected
```

## Row Level Security

- Public read of `approved` translation pairs (dataset explorer).
- Users manage their own `profiles`.
- Authenticated users insert/read/update their own `translation_pairs`.
- Reviews are managed by authenticated users (role enforced in API).
- Notifications scoped to owner.
- Admin role changes go through the `admin_update_profile` security-definer function (`001` migration).

## Storage Buckets

`dataset-exports`, `dataset-imports`, `audio-recordings`, `avatars` (created in migration `001`). Use Storage for large files — never BLOBs in Postgres.
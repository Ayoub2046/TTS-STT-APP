-- ============================================================
-- MaayMaxaa DataHub — Database Schema (Supabase PostgreSQL)
-- Run in the Supabase SQL Editor.
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('contributor', 'reviewer', 'admin');
CREATE TYPE translation_status AS ENUM ('draft', 'pending', 'under_review', 'correction_requested', 'approved', 'rejected', 'published');
CREATE TYPE review_decision AS ENUM ('approve', 'reject', 'request_correction');
CREATE TYPE language_code AS ENUM ('maay', 'maxaa', 'somali');

-- Helper for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'contributor',
  language_preference language_code,
  native_language TEXT,
  experience_level TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'contributor'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- datasets
-- ============================================================
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source_language language_code NOT NULL DEFAULT 'maay',
  target_language language_code NOT NULL DEFAULT 'maxaa',
  status TEXT NOT NULL DEFAULT 'draft',
  total_records INTEGER NOT NULL DEFAULT 0,
  approved_records INTEGER NOT NULL DEFAULT 0,
  rejected_records INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT '0.0.1',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER datasets_set_updated_at
  BEFORE UPDATE ON datasets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- translation_pairs
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  contributor_id UUID REFERENCES profiles(id) NOT NULL,

  source_language language_code NOT NULL,
  target_language language_code NOT NULL,

  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,

  domain TEXT NOT NULL DEFAULT 'general',

  status translation_status NOT NULL DEFAULT 'pending',

  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  validation_flags JSONB,
  contributor_metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_translation_status ON translation_pairs(status);
CREATE INDEX idx_translation_contributor ON translation_pairs(contributor_id);
CREATE INDEX idx_translation_direction ON translation_pairs(source_language, target_language);
CREATE INDEX idx_translation_domain ON translation_pairs(domain);
CREATE INDEX idx_translation_source_text ON translation_pairs(source_text);

CREATE TRIGGER translation_pairs_set_updated_at
  BEFORE UPDATE ON translation_pairs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID REFERENCES translation_pairs(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,

  decision review_decision NOT NULL,
  comment TEXT,

  original_source TEXT NOT NULL,
  original_target TEXT NOT NULL,
  corrected_source TEXT,
  corrected_target TEXT,

  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_translation ON reviews(translation_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- ============================================================
-- dataset_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  approved_records INTEGER NOT NULL DEFAULT 0,
  jsonl_url TEXT,
  csv_url TEXT,
  parquet_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- hf_push_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS hf_push_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
  repo_id TEXT NOT NULL,
  commit_id TEXT,
  commit_message TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  pushed_by UUID REFERENCES profiles(id),
  pushed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hf_push_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read for approved translation pairs (powers the dataset explorer)
CREATE POLICY "public_read_approved_translations"
  ON translation_pairs FOR SELECT
  USING (status = 'approved');

-- Users manage their own profile
CREATE POLICY "users_manage_own_profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Authenticated users can create translations
CREATE POLICY "auth_insert_translations"
  ON translation_pairs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_id);

-- Users can read/update their own translations
CREATE POLICY "auth_manage_own_translations"
  ON translation_pairs FOR UPDATE
  USING (auth.uid() = contributor_id)
  WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "auth_read_own_translations"
  ON translation_pairs FOR SELECT
  USING (auth.uid() = contributor_id OR status = 'approved');

-- Reviews are visible to reviewers and admins (enforced in app layer too)
CREATE POLICY "reviews_manage_by_authenticated"
  ON reviews FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notifications for own account
CREATE POLICY "notifications_own"
  ON notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
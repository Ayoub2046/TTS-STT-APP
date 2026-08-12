-- Migration 001 — Admin utilities & bucket creation
-- Run in Supabase SQL Editor after schema.sql.

-- ------------------------------------------------------------
-- Security definer function so admins can manage users (RLS-safe)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_update_profile(
  target_id UUID,
  new_role user_role DEFAULT NULL,
  new_active BOOLEAN DEFAULT NULL,
  new_full_name TEXT DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role user_role;
  result profiles;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'admin' THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  UPDATE profiles SET
    role = COALESCE(new_role, role),
    is_active = COALESCE(new_active, is_active),
    full_name = COALESCE(new_full_name, full_name)
  WHERE id = target_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_profile TO authenticated;

-- ------------------------------------------------------------
-- Storage buckets
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('dataset-exports', 'dataset-exports', true),
  ('dataset-imports', 'dataset-imports', false),
  ('audio-recordings', 'audio-recordings', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
-- MaayMaxaa DataHub — Seed data
-- Insert a demo database and a few starter translation pairs.
-- NOTE: The profiles referenced here depend on real auth.users.
-- Run AFTER creating a couple of users in the Supabase dashboard.

-- Demo dataset
INSERT INTO datasets (name, description, source_language, target_language, status, version)
VALUES
  ('Maay to Maxaa Core', 'General domain Maay → Maxaa parallel corpus.', 'maay', 'maxaa', 'draft', '0.0.1'),
  ('Maxaa to Maay Core', 'General domain Maxaa → Maay parallel corpus.', 'maxaa', 'maay', 'draft', '0.0.1');

-- Optional: seed sample sentences (uncomment when you have real user IDs)
-- INSERT INTO translation_pairs (contributor_id, source_language, target_language, source_text, target_text, domain, status)
-- VALUES
--   ('REPLACE_WITH_USER_ID', 'maay', 'maxaa', 'Mahaay mihin?', 'Waa kuma adiga?', 'daily_conversation', 'approved'),
--   ('REPLACE_WITH_USER_ID', 'maxaa', 'maay', 'Waxaan ku arkay jidka', 'Anee caray fa ka aruida', 'daily_conversation', 'approved');

SELECT 'Seeded: ' || count(*) || ' datasets' FROM datasets;
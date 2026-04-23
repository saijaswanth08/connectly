-- ============================================================
-- Fix contacts table column names to match frontend codebase
-- ============================================================

-- 1. Rename importance → priority
--    The frontend sends { priority: "..." } but the DB column was "importance"
ALTER TABLE public.contacts
  RENAME COLUMN importance TO priority;

-- 2. Rename linkedin_url → linkedin
--    The frontend sends { linkedin: "..." } but the DB column was "linkedin_url"
ALTER TABLE public.contacts
  RENAME COLUMN linkedin_url TO linkedin;

-- 3. Add instagram column (was missing from contacts table, only existed on profiles)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '';

-- 4. Drop legacy columns that are no longer used by the frontend
--    (safe to remove - these were never populated by the current UI)
ALTER TABLE public.contacts
  DROP COLUMN IF EXISTS meeting_location,
  DROP COLUMN IF EXISTS meeting_date;

-- 5. Verify final contacts table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'contacts'
ORDER BY ordinal_position;

-- Add missing columns to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags text[];

-- Rename misspelled table
ALTER TABLE IF EXISTS profilees RENAME TO profiles;

-- Ensure profiles table exists with correct schema used by the app
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Ensure missing columns exist if the table was renamed from profilees
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

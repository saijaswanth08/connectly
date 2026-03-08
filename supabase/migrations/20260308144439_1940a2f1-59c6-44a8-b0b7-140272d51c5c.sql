
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS company text DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Allow anyone to view public profiles by username
CREATE POLICY "Anyone can view profiles by username"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (username IS NOT NULL AND username != '');

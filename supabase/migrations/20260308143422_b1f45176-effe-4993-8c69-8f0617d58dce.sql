
-- Create user_presence table
CREATE TABLE public.user_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'offline',
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read presence (needed to see other users' status)
CREATE POLICY "Authenticated users can view all presence"
  ON public.user_presence FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
  ON public.user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own presence
CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

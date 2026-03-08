
CREATE TABLE public.user_2fa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  secret_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  recovery_codes text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 2fa" ON public.user_2fa
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2fa" ON public.user_2fa
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2fa" ON public.user_2fa
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own 2fa" ON public.user_2fa
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

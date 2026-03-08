
CREATE TABLE public.contact_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id_a UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  contact_id_b UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'colleague',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id_a, contact_id_b)
);

ALTER TABLE public.contact_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public.contact_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.contact_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.contact_connections FOR DELETE USING (auth.uid() = user_id);

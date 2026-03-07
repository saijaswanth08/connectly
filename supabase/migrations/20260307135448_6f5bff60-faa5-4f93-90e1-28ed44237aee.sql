
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  meeting_location TEXT DEFAULT '',
  meeting_date DATE,
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  importance TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_search ON public.contacts USING GIN (to_tsvector('english', name || ' ' || company || ' ' || job_title || ' ' || notes));

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  meeting_link TEXT DEFAULT '',
  meeting_type TEXT NOT NULL DEFAULT 'other',
  location TEXT DEFAULT '',
  meeting_time TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings" ON public.meetings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meetings" ON public.meetings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meetings" ON public.meetings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Voice notes table
CREATE TABLE public.voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  audio_file_url TEXT NOT NULL,
  transcription TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice notes" ON public.voice_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice notes" ON public.voice_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own voice notes" ON public.voice_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Voice notes storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', false);

CREATE POLICY "Users can upload voice notes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own voice notes files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own voice notes files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

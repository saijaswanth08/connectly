-- Migration: Add daily digest enabled to profiles and email_sent to reminders
ALTER TABLE public.profiles
ADD COLUMN daily_digest_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.reminders
ADD COLUMN email_sent boolean NOT NULL DEFAULT false;

-- We don't really need a new index unless we have millions of users,
-- but creating an index on email_sent could be useful if table grows:
-- CREATE INDEX idx_reminders_email_sent ON public.reminders(email_sent);

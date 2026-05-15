-- Run this in your Supabase SQL Editor
-- Make sure to replace YOUR_PROJECT_REF and YOUR_ANON_KEY with your actual project details!

-- Enable the pg_net extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run daily at 13:00 UTC (which is 8:00 AM EST)
SELECT cron.schedule(
  'invoke-daily-digest',
  '0 13 * * *', -- Everyday at 13:00
  $$
    SELECT net.http_post(
        url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-digest',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);

-- Note: You can view scheduled jobs with:
-- SELECT * FROM cron.job;
-- And you can unschedule with:
-- SELECT cron.unschedule('invoke-daily-digest');

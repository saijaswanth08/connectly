-- Migration to clean up duplicate contacts, fix typos in emails, and merge/de-duplicate conversations
-- 1. Fix the email typo on any contacts created with double 'l' nallamaru
UPDATE public.contacts
SET email = 'saijaswanthnalamaru@gmail.com'
WHERE LOWER(email) = 'saijaswanthnallamaru@gmail.com';

-- 2. Resolve and backfill the correct target_user_id from profiles
UPDATE public.contacts c
SET target_user_id = p.id
FROM public.profiles p
WHERE LOWER(TRIM(c.email)) = LOWER(p.email)
  AND c.target_user_id IS NULL;

-- 3. De-duplicate Contacts & Merge Conversations (by email)
DO $$
DECLARE
    r RECORD;
    v_keep_contact_id UUID;
BEGIN
    FOR r IN 
        SELECT user_id, email, COUNT(*) as cnt
        FROM public.contacts
        WHERE email IS NOT NULL AND email <> ''
        GROUP BY user_id, email
        HAVING COUNT(*) > 1
    LOOP
        -- Find the oldest contact (which was manually added) to keep
        SELECT id INTO v_keep_contact_id
        FROM public.contacts
        WHERE user_id = r.user_id AND email = r.email
        ORDER BY created_at ASC
        LIMIT 1;

        -- Re-map conversations pointing to duplicates to the kept contact
        UPDATE public.conversations
        SET contact_id = v_keep_contact_id
        WHERE contact_id IN (
            SELECT id FROM public.contacts
            WHERE user_id = r.user_id AND email = r.email AND id <> v_keep_contact_id
        );

        -- Delete the duplicate contact records safely
        DELETE FROM public.contacts
        WHERE user_id = r.user_id AND email = r.email AND id <> v_keep_contact_id;
    END LOOP;
END $$;

-- 4. De-duplicate Contacts & Merge Conversations (by target_user_id)
DO $$
DECLARE
    r RECORD;
    v_keep_contact_id UUID;
BEGIN
    FOR r IN 
        SELECT user_id, target_user_id, COUNT(*) as cnt
        FROM public.contacts
        WHERE target_user_id IS NOT NULL
        GROUP BY user_id, target_user_id
        HAVING COUNT(*) > 1
    LOOP
        -- Find the oldest contact for this user + target_user_id combination
        SELECT id INTO v_keep_contact_id
        FROM public.contacts
        WHERE user_id = r.user_id AND target_user_id = r.target_user_id
        ORDER BY created_at ASC
        LIMIT 1;

        -- Re-map conversations
        UPDATE public.conversations
        SET contact_id = v_keep_contact_id
        WHERE contact_id IN (
            SELECT id FROM public.contacts
            WHERE user_id = r.user_id AND target_user_id = r.target_user_id AND id <> v_keep_contact_id
        );

        -- Delete the duplicates
        DELETE FROM public.contacts
        WHERE user_id = r.user_id AND target_user_id = r.target_user_id AND id <> v_keep_contact_id;
    END LOOP;
END $$;

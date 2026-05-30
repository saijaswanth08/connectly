-- =========================================================================
-- Migration: Enforce non-empty email matching for contact target resolution
-- Focus: Fixes the bug where contacts with blank emails ("") were incorrectly 
-- linked to user profiles that also had blank emails ("") by enforcing strict,
-- non-empty validation in the resolution trigger and database constraints.
-- =========================================================================

-- Step 1: Clean up any existing incorrect contact associations matched on blank/empty emails
UPDATE public.contacts
SET target_user_id = NULL
WHERE email IS NULL OR TRIM(email) = '';

-- Step 2: Restore any remaining blank or NULL profile emails from the auth.users source of truth
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR TRIM(p.email) = '');

-- Step 3: Add a database CHECK constraint on public.profiles to prevent emails from ever being blank
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS check_email_not_empty;

ALTER TABLE public.profiles 
  ADD CONSTRAINT check_email_not_empty CHECK (email IS NOT NULL AND email <> '');

-- Step 4: Re-define the trigger function with rigorous non-empty check
CREATE OR REPLACE FUNCTION public.resolve_contact_target_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only attempt matching if the contact's email is not null, not blank, and contains '@'
    IF NEW.target_user_id IS NULL 
       AND NEW.email IS NOT NULL 
       AND TRIM(NEW.email) <> '' 
       AND NEW.email LIKE '%@%' THEN
       
        SELECT id INTO NEW.target_user_id
        FROM public.profiles
        WHERE LOWER(email) = LOWER(TRIM(NEW.email))
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

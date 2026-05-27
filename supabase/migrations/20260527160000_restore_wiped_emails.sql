-- ============================================================
-- Migration: Restore wiped/blank emails in profiles table
-- Root cause: handleRemovePhoto() used upsert() which could
-- overwrite entire profile rows, blanking out the email field.
-- Fix: sync email from auth.users (source of truth) for any
-- profiles where email is NULL or empty string.
-- ============================================================

-- Step 1: Restore emails from auth.users into profiles where blank/missing
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Step 2: Create/replace a trigger function that keeps profile email in sync
-- whenever auth.users email changes (e.g., after email verification)
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When auth.users.email_confirmed_at is set or email changes, update profiles
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id
    AND (email IS NULL OR email = '' OR email != NEW.email);
  RETURN NEW;
END;
$$;

-- Step 3: Attach the trigger on auth.users (if not already existing)
DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

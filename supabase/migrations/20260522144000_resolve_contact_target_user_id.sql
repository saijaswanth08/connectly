-- Automatically resolve target_user_id for manually added or updated contacts based on email matching profiles
CREATE OR REPLACE FUNCTION public.resolve_contact_target_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.target_user_id IS NULL AND NEW.email IS NOT NULL AND NEW.email <> '' THEN
        SELECT id INTO NEW.target_user_id
        FROM public.profiles
        WHERE LOWER(email) = LOWER(TRIM(NEW.email))
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to run before insert or update of email / target_user_id
DROP TRIGGER IF EXISTS trg_resolve_contact_target_user_id ON public.contacts;
CREATE TRIGGER trg_resolve_contact_target_user_id
    BEFORE INSERT OR UPDATE OF email, target_user_id ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.resolve_contact_target_user_id();

-- One-time update to backfill target_user_id for all existing manual contacts
UPDATE public.contacts
SET target_user_id = (
    SELECT id FROM public.profiles
    WHERE LOWER(public.profiles.email) = LOWER(TRIM(public.contacts.email))
    LIMIT 1
)
WHERE target_user_id IS NULL AND email IS NOT NULL AND email <> '';

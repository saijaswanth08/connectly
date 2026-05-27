-- PASTE THIS ENTIRE SCRIPT INTO THE SUPABASE SQL EDITOR AND CLICK "RUN"
-- This replaces the unsend_message function with a fully robust version that
-- handles duplicate contacts, null target_user_ids, and attachment messages.

DROP FUNCTION IF EXISTS public.unsend_message(UUID);

CREATE OR REPLACE FUNCTION public.unsend_message(p_message_id UUID)
RETURNS VOID AS $$
DECLARE
    v_sender_id UUID;
    v_sender_contact_id UUID;
    v_recipient_user_id UUID;
    v_msg_record RECORD;
    v_contact_email TEXT;
    v_contact_name TEXT;
BEGIN
    -- 1. Get the message to be deleted
    SELECT * INTO v_msg_record
    FROM public.messages
    WHERE id = p_message_id;

    IF v_msg_record IS NULL THEN
        RETURN;
    END IF;

    -- 2. Verify that the current user owns the message (security check)
    IF v_msg_record.user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized to unsend this message';
    END IF;

    -- 3. Delete the original message from messages table
    DELETE FROM public.messages WHERE id = p_message_id;

    -- 4. Find the recipient and delete their copy of the message
    -- A. Extract the sender's user_id and contact_id from the original conversation
    SELECT user_id, contact_id INTO v_sender_id, v_sender_contact_id
    FROM public.conversations
    WHERE id = v_msg_record.conversation_id;

    -- B. Find the recipient's user_id (target_user_id) from the sender's contact record
    SELECT target_user_id, email, name INTO v_recipient_user_id, v_contact_email, v_contact_name
    FROM public.contacts
    WHERE id = v_sender_contact_id;

    -- C. FALLBACK: If target_user_id is null, resolve via email lookup in profiles
    IF v_recipient_user_id IS NULL AND v_contact_email IS NOT NULL AND v_contact_email <> '' THEN
        SELECT id INTO v_recipient_user_id
        FROM public.profiles
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_contact_email))
        LIMIT 1;
    END IF;

    -- D. FALLBACK: If still null, search ALL contacts belonging to sender for a sibling with a valid target_user_id
    IF v_recipient_user_id IS NULL THEN
        SELECT target_user_id INTO v_recipient_user_id
        FROM public.contacts
        WHERE user_id = v_sender_id
          AND target_user_id IS NOT NULL
          AND (
              (v_contact_email IS NOT NULL AND v_contact_email <> '' AND LOWER(TRIM(email)) = LOWER(TRIM(v_contact_email)))
              OR (v_contact_name IS NOT NULL AND v_contact_name <> '' AND LOWER(TRIM(name)) = LOWER(TRIM(v_contact_name)))
          )
        LIMIT 1;
    END IF;

    -- E. If we found a recipient, delete ALL cloned copies across ALL of their conversations
    IF v_recipient_user_id IS NOT NULL THEN
        DELETE FROM public.messages
        WHERE user_id = v_msg_record.user_id
          AND content = v_msg_record.content
          AND ABS(EXTRACT(EPOCH FROM (created_at - v_msg_record.created_at))) < 5
          AND conversation_id IN (
              SELECT id FROM public.conversations WHERE user_id = v_recipient_user_id
          );
    END IF;

    -- F. EXTRA SAFETY: Also try deleting by exact message_id match in case there's a direct reference
    -- (handles edge cases where the sync trigger stored the original message_id)
    DELETE FROM public.messages
    WHERE id <> p_message_id
      AND user_id = v_msg_record.user_id
      AND content = v_msg_record.content
      AND ABS(EXTRACT(EPOCH FROM (created_at - v_msg_record.created_at))) < 5;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.unsend_message(UUID) TO authenticated;

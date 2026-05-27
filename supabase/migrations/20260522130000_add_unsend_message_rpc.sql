-- Add secure unsend_message RPC to delete original and synced messages atomically across all duplicate conversations
CREATE OR REPLACE FUNCTION public.unsend_message(p_message_id UUID)
RETURNS VOID AS $$
DECLARE
    v_sender_id UUID;
    v_sender_contact_id UUID;
    v_recipient_user_id UUID;
    v_msg_record RECORD;
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

    -- 4. Find the recipient conversation to delete the cloned message
    -- A. Extract the sender's user_id and contact_id from the original conversation
    SELECT user_id, contact_id INTO v_sender_id, v_sender_contact_id
    FROM public.conversations
    WHERE id = v_msg_record.conversation_id;

    -- B. Find the recipient's user_id (target_user_id) from the sender's contact record
    SELECT target_user_id INTO v_recipient_user_id
    FROM public.contacts
    WHERE id = v_sender_contact_id;

    IF v_recipient_user_id IS NOT NULL THEN
        -- C. Delete the cloned messages in ALL of the recipient's conversations (peer-to-peer sync)
        -- This handles duplicate/sibling conversations perfectly!
        DELETE FROM public.messages
        WHERE user_id = v_msg_record.user_id
          AND created_at = v_msg_record.created_at
          AND content = v_msg_record.content
          AND conversation_id IN (
              SELECT id FROM public.conversations WHERE user_id = v_recipient_user_id
          );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.unsend_message(UUID) TO authenticated;

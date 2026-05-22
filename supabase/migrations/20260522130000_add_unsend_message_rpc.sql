-- Add secure unsend_message RPC to delete original and synced messages atomically
CREATE OR REPLACE FUNCTION public.unsend_message(p_message_id UUID)
RETURNS VOID AS $$
DECLARE
    v_sender_id UUID;
    v_sender_contact_id UUID;
    v_recipient_user_id UUID;
    v_recipient_contact_id UUID;
    v_recipient_conv_id UUID;
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
        -- C. Locate the recipient's contact record pointing back to the sender
        SELECT id INTO v_recipient_contact_id
        FROM public.contacts
        WHERE user_id = v_recipient_user_id AND target_user_id = v_sender_id
        LIMIT 1;

        IF v_recipient_contact_id IS NOT NULL THEN
            -- D. Find the recipient's conversation record with the sender
            SELECT id INTO v_recipient_conv_id
            FROM public.conversations
            WHERE user_id = v_recipient_user_id AND contact_id = v_recipient_contact_id
            LIMIT 1;

            IF v_recipient_conv_id IS NOT NULL THEN
                -- E. Delete the cloned message in the recipient's conversation (peer-to-peer sync)
                DELETE FROM public.messages
                WHERE conversation_id = v_recipient_conv_id
                  AND user_id = v_msg_record.user_id
                  AND created_at = v_msg_record.created_at
                  AND content = v_msg_record.content;
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.unsend_message(UUID) TO authenticated;

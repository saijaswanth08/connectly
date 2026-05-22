-- Sync messages across conversations for peer-to-peer chats and update RLS policies

-- 1. Correct SELECT policy on public.messages to allow users to view messages belonging to their conversations
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE public.conversations.id = public.messages.conversation_id
        AND public.conversations.user_id = auth.uid()
    )
  );

-- 2. Create the sync_conversation_message trigger function to clone messages between peer conversations
CREATE OR REPLACE FUNCTION public.sync_conversation_message()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_id UUID;
    v_sender_contact_id UUID;
    v_recipient_user_id UUID;
    v_recipient_contact_id UUID;
    v_recipient_conv_id UUID;
    v_recipient_sender_type TEXT;
BEGIN
    -- Prevent recursive trigger loops by checking execution depth
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- A. Extract the sender's user_id and contact_id from the current conversation
    SELECT user_id, contact_id INTO v_sender_id, v_sender_contact_id
    FROM public.conversations
    WHERE id = NEW.conversation_id;

    -- B. Find the recipient's user_id (target_user_id) from the sender's contact record
    SELECT target_user_id INTO v_recipient_user_id
    FROM public.contacts
    WHERE id = v_sender_contact_id;

    -- If there is no registered target user associated with this contact, it's local only; do not sync
    IF v_recipient_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Fetch the sender's email and name from profiles
    DECLARE
        v_sender_name TEXT := 'Unknown';
        v_sender_email TEXT := '';
    BEGIN
        SELECT name, email INTO v_sender_name, v_sender_email
        FROM public.profiles
        WHERE id = v_sender_id;

        -- C. Locate the recipient's contact record pointing back to the sender
        -- Match by target_user_id OR by email matching
        SELECT id INTO v_recipient_contact_id
        FROM public.contacts
        WHERE user_id = v_recipient_user_id 
          AND (target_user_id = v_sender_id OR (email IS NOT NULL AND email <> '' AND LOWER(email) = LOWER(v_sender_email)))
        LIMIT 1;

        -- If contact exists but has NULL target_user_id, update it!
        IF v_recipient_contact_id IS NOT NULL THEN
            UPDATE public.contacts
            SET target_user_id = v_sender_id
            WHERE id = v_recipient_contact_id AND target_user_id IS NULL;
        ELSE
            -- If the recipient doesn't have the sender in their contacts, auto-create it!
            INSERT INTO public.contacts (user_id, name, email, target_user_id, priority)
            VALUES (v_recipient_user_id, v_sender_name, v_sender_email, v_sender_id, 'medium')
            RETURNING id INTO v_recipient_contact_id;
        END IF;
    END;

    -- D. Find or create the recipient's conversation record with the sender
    SELECT id INTO v_recipient_conv_id
    FROM public.conversations
    WHERE user_id = v_recipient_user_id AND contact_id = v_recipient_contact_id
    LIMIT 1;

    IF v_recipient_conv_id IS NULL THEN
        INSERT INTO public.conversations (user_id, contact_id, last_message, last_message_at)
        VALUES (v_recipient_user_id, v_recipient_contact_id, NEW.content, NEW.created_at)
        RETURNING id INTO v_recipient_conv_id;
    ELSE
        UPDATE public.conversations
        SET last_message = NEW.content, last_message_at = NEW.created_at
        WHERE id = v_recipient_conv_id;
    END IF;

    -- E. Determine the recipient's perspective sender_type (reverse 'user' <-> 'contact')
    IF NEW.sender_type = 'user' THEN
        v_recipient_sender_type := 'contact';
    ELSIF NEW.sender_type = 'contact' THEN
        v_recipient_sender_type := 'user';
    ELSE
        v_recipient_sender_type := NEW.sender_type;
    END IF;

    -- F. Insert the cloned message into the recipient's conversation
    INSERT INTO public.messages (conversation_id, user_id, sender_type, content, created_at)
    VALUES (v_recipient_conv_id, NEW.user_id, v_recipient_sender_type, NEW.content, NEW.created_at);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the trigger to the messages table
DROP TRIGGER IF EXISTS trg_sync_conversation_message ON public.messages;
CREATE TRIGGER trg_sync_conversation_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_conversation_message();

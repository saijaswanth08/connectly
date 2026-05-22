import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });
}

export function useMessages(conversationId: string | string[] | null) {
  return useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const ids = Array.isArray(conversationId) ? conversationId : [conversationId];
      if (ids.length === 0) return [];
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!conversationId && (Array.isArray(conversationId) ? conversationId.length > 0 : true),
  });
}

export function useRealtimeMessages(conversationId: string | string[] | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const ids = Array.isArray(conversationId) ? conversationId : [conversationId];
    if (ids.length === 0) return;

    const channels = ids.map((id) => {
      return supabase
        .channel(`messages-${id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to INSERT, UPDATE, and DELETE events!
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${id}`,
          },
          () => {
            qc.invalidateQueries({ queryKey: ["messages", conversationId] });
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [conversationId, qc]);
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useRealtimeConversations() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          qc.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      senderType = "user",
    }: {
      conversationId: string;
      content: string;
      senderType?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        sender_type: senderType,
        content,
      });
      if (msgError) throw msgError;

      const { error: convError } = await supabase
        .from("conversations")
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
      if (convError) throw convError;
    },
    onMutate: async (newMessage) => {
      await qc.cancelQueries({ queryKey: ["messages", newMessage.conversationId] });
      const previousMessages = qc.getQueryData(["messages", newMessage.conversationId]);

      qc.setQueryData(["messages", newMessage.conversationId], (old: Message[] | undefined) => [
        ...(old || []),
        {
          id: `temp-${Date.now()}`,
          conversation_id: newMessage.conversationId,
          user_id: user?.id || "",
          sender_type: newMessage.senderType || "user",
          content: newMessage.content,
          created_at: new Date().toISOString(),
        },
      ]);

      return { previousMessages, conversationId: newMessage.conversationId };
    },
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        qc.setQueryData(["messages", context.conversationId], context.previousMessages);
      }
    },
    onSettled: (data, error, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useClearConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId);
      if (error) throw error;

      // Update conversation last message to empty
      const { error: convError } = await supabase
        .from("conversations")
        .update({ last_message: "", last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      if (convError) throw convError;
    },
    onSuccess: (_, conversationId) => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useGetOrCreateConversation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contactId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check existing
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("contact_id", contactId)
        .maybeSingle();

      if (existing) return existing as Conversation;

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, contact_id: contactId })
        .select()
        .single();
      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUnreadCount() {
  // Simple unread count based on conversations with recent messages
  const { data: conversations } = useConversations();
  return conversations?.length ?? 0;
}

export interface MessageRequest {
  id: string;
  recipient_id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export function useMessageRequests() {
  const { user } = useAuth();
  return useQuery<MessageRequest[]>({
    queryKey: ["message_requests"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("message_requests")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MessageRequest[];
    },
    enabled: !!user,
  });
}

export function useHandleMessageRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'accept' | 'reject' }) => {
      const { error } = await supabase.rpc('handle_message_request', {
        p_request_id: requestId,
        p_action: action
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message_requests"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["messages"] });
    }
  });
}

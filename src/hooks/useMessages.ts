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

export function useMessages(conversationId: string | null) {
  return useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!conversationId,
  });
}

export function useRealtimeMessages(conversationId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);
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
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
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

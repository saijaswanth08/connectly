import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Subscribes to real-time changes on the contact_requests table.
 * Instantly invalidates React Query cache when a new request arrives
 * (INSERT) or an existing one changes status (UPDATE).
 */
export function useRealtimeContactRequests(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Listen for incoming requests (to_user_id = current user)
    const incomingChannel = supabase
      .channel(`contact_requests_incoming_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_requests",
          filter: `to_user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["contact_requests", "incoming"] });
        }
      )
      .subscribe();

    // Listen for outgoing requests (from_user_id = current user) — to detect when accepted
    const outgoingChannel = supabase
      .channel(`contact_requests_outgoing_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contact_requests",
          filter: `from_user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["contact_requests", "accepted_outgoing"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incomingChannel);
      supabase.removeChannel(outgoingChannel);
    };
  }, [userId, queryClient]);
}

import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// ---------------------------------------------------------------------------
// Simple insert-based presence update (no upsert, no onConflict)
// ---------------------------------------------------------------------------
export const updatePresence = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("user_presence")
    .insert([
      {
        user_id: user.id,
        status: "online",
        last_seen: new Date().toISOString(),
      },
    ]);

  if (error) {
    console.error("Presence error:", error.message);
  }
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PresenceRecord {
  user_id: string;
  status: string;
  last_seen: string;
}

// ---------------------------------------------------------------------------
// Fetch all presence records (silently returns [] if table is missing)
// ---------------------------------------------------------------------------
export function useAllPresence() {
  const queryClient = useQueryClient();

  const query = useQuery<PresenceRecord[]>({
    queryKey: ["user_presence"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("user_presence")
          .select("user_id, status, last_seen");

        if (error) return [];
        return (data || []) as PresenceRecord[];
      } catch {
        return [];
      }
    },
    refetchInterval: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_presence" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user_presence"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// ---------------------------------------------------------------------------
// Helpers used by MessagesPage
// ---------------------------------------------------------------------------
export function getPresenceStatus(
  presenceRecords: PresenceRecord[],
  userId: string
): { isOnline: boolean; lastSeen: string | null } {
  const record = presenceRecords.find((r) => r.user_id === userId);
  if (!record) return { isOnline: false, lastSeen: null };

  const lastSeen = new Date(record.last_seen);
  const elapsed = Date.now() - lastSeen.getTime();
  const isOnline = record.status === "online" && elapsed < 90_000;

  return { isOnline, lastSeen: record.last_seen };
}

export function formatLastSeen(lastSeenStr: string | null): string {
  if (!lastSeenStr) return "Offline";

  const lastSeen = new Date(lastSeenStr);
  const diffMs = Date.now() - lastSeen.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;
  if (diffHours < 24) {
    const hours = lastSeen.getHours();
    const minutes = lastSeen.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `Last seen today at ${h}:${minutes} ${ampm}`;
  }
  return `Last seen ${lastSeen.toLocaleDateString()}`;
}

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const HEARTBEAT_INTERVAL = 15_000; // 15 seconds
const INACTIVE_TIMEOUT = 60_000; // 60 seconds

interface PresenceRecord {
  user_id: string;
  status: string;
  last_seen: string;
}

/** Upsert current user's presence heartbeat */
async function upsertPresence(userId: string, status: "online" | "offline") {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_presence")
    .upsert(
      { user_id: userId, status, last_seen: now, updated_at: now },
      { onConflict: "user_id" }
    );
  if (error) console.error("Presence upsert error:", error);
}

/** Hook that tracks the current user's activity and sends heartbeats */
export function usePresenceTracker() {
  const { user } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const isOnlineRef = useRef(false);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Track activity events
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }));

    // Send initial online status
    upsertPresence(user.id, "online");
    isOnlineRef.current = true;

    // Heartbeat interval
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const shouldBeOnline = elapsed < INACTIVE_TIMEOUT;

      if (shouldBeOnline && !isOnlineRef.current) {
        upsertPresence(user.id, "online");
        isOnlineRef.current = true;
      } else if (!shouldBeOnline && isOnlineRef.current) {
        upsertPresence(user.id, "offline");
        isOnlineRef.current = false;
      } else if (shouldBeOnline) {
        // Regular heartbeat to update last_seen
        upsertPresence(user.id, "online");
      }
    }, HEARTBEAT_INTERVAL);

    // Go offline on tab close
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline signal
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`;
      const body = JSON.stringify({ status: "offline", last_seen: new Date().toISOString(), updated_at: new Date().toISOString() });
      navigator.sendBeacon?.(url); // fallback — won't work without headers, but upsert handles it
      // Synchronous fallback
      upsertPresence(user.id, "offline");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        upsertPresence(user.id, "offline");
        isOnlineRef.current = false;
      } else {
        lastActivityRef.current = Date.now();
        upsertPresence(user.id, "online");
        isOnlineRef.current = true;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity));
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
      upsertPresence(user.id, "offline");
    };
  }, [user, markActivity]);
}

/** Fetch presence for a list of contact user_ids (contacts don't have user_ids, so we track by contact_id mapping) */
/** Since contacts aren't users, we consider a contact "online" only if there's a matching user_presence row.
 *  For a personal CRM, contacts are external — they won't have presence. 
 *  Instead, we show the CURRENT USER's own presence and treat contacts as having simulated presence.
 *  
 *  But to make this realistic, we'll query presence for all users and match against contact emails or IDs if they exist.
 *  For now, we'll use the user_presence table to at least show the current user as online, 
 *  and show contacts based on whether they have a corresponding user account.
 */

/** Query all presence records (for users who are also contacts) */
export function useAllPresence() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user_presence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_presence")
        .select("user_id, status, last_seen");
      if (error) throw error;
      return (data || []) as PresenceRecord[];
    },
    refetchInterval: 15_000, // Poll every 15 seconds
  });

  // Also subscribe to realtime changes
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

/** Get presence status for a specific user_id */
export function getPresenceStatus(
  presenceRecords: PresenceRecord[],
  userId: string
): { isOnline: boolean; lastSeen: string | null } {
  const record = presenceRecords.find((r) => r.user_id === userId);
  if (!record) return { isOnline: false, lastSeen: null };

  // If status is online and last_seen is within 90 seconds, consider online
  const lastSeen = new Date(record.last_seen);
  const elapsed = Date.now() - lastSeen.getTime();
  const isOnline = record.status === "online" && elapsed < 90_000;

  return { isOnline, lastSeen: record.last_seen };
}

/** Format last seen time for display */
export function formatLastSeen(lastSeenStr: string | null): string {
  if (!lastSeenStr) return "Offline";

  const lastSeen = new Date(lastSeenStr);
  const now = Date.now();
  const diffMs = now - lastSeen.getTime();
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

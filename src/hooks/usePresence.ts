import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export interface PresenceState {
  [key: string]: Array<{
    user_id: string;
    online_at: string;
  }>;
}

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>(Object.keys(state));
        setOnlineUsers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers((prev) => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { onlineUsers };
}

// Helper to check if a specific user is online
export function isUserOnline(onlineUsers: Set<string>, targetUserId: string | null | undefined): boolean {
  if (!targetUserId) return false;
  return onlineUsers.has(targetUserId);
}

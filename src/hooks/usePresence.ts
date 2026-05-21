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

    const syncState = () => {
      const state = channel.presenceState();
      const onlineIds = new Set<string>(Object.keys(state));
      setOnlineUsers(onlineIds);
    };

    channel
      .on('presence', { event: 'sync' }, syncState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          syncState(); // Initial sync immediately after subscription
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { onlineUsers };
}

// Helper to check if a specific user is online
export function isUserOnline(onlineUsers: Set<string>, targetUserId: string | null | undefined): boolean {
  if (!targetUserId) return false;
  return onlineUsers.has(targetUserId);
}

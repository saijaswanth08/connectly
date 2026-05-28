import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export interface PresenceState {
  [key: string]: Array<{
    user_id: string;
    online_at: string;
  }>;
}

// Module-level singleton state to keep exactly one shared subscription active
let globalChannel: any = null;
let globalChannelUserId: string | null = null;
let globalOnlineUsers: Set<string> = new Set();
const listeners = new Set<(users: Set<string>) => void>();

// Clean helper to remove/destroy the global channel immediately
function removeGlobalChannel() {
  if (globalChannel) {
    try {
      globalChannel.untrack();
    } catch (e) {
      console.warn("[removeGlobalChannel] Error untracking channel:", e);
    }
    supabase.removeChannel(globalChannel);
    globalChannel = null;
  }
  globalChannelUserId = null;
  globalOnlineUsers = new Set();
  // Broadcast empty online users list since we are offline
  listeners.forEach((l) => l(globalOnlineUsers));
}

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(globalOnlineUsers);
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== "undefined" ? document.visibilityState === 'visible' : true
  );

  // Track tab visibility changes reactively and immediately
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !isTabVisible) {
      // Clear presence state and close connection immediately when logged out or tab is hidden
      removeGlobalChannel();
      return;
    }

    // If the logged-in user changed, cleanly remove the existing channel first to recreate it
    if (globalChannel && globalChannelUserId !== user.id) {
      removeGlobalChannel();
    }

    // Add this hook instance's state updater to our shared listeners set
    const listener = (users: Set<string>) => {
      setOnlineUsers(new Set(users));
    };
    listeners.add(listener);

    // Initialize the shared presence channel immediately if it doesn't exist
    if (!globalChannel) {
      globalChannelUserId = user.id;
      const channel = supabase.channel('global-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      const syncState = () => {
        const state = channel.presenceState();
        globalOnlineUsers = new Set<string>(Object.keys(state));
        // Broadcast the updated online users set to all active hook listeners
        listeners.forEach((l) => l(globalOnlineUsers));
      };

      channel
        .on('presence', { event: 'sync' }, syncState)
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            syncState(); // Immediately synchronize the state after subscription
          }
        });

      globalChannel = channel;
    } else {
      // If the channel is already active, immediately initialize the caller state
      listener(globalOnlineUsers);
    }

    // Cleanup when this specific hook instance unmounts
    return () => {
      listeners.delete(listener);

      // Immediately teardown global channel if no more listeners exist
      if (listeners.size === 0) {
        removeGlobalChannel();
      }
    };
  }, [user?.id, isTabVisible]);

  // Handle instant browser close or tab unload immediately (mobile & desktop)
  useEffect(() => {
    if (!user?.id) return;

    const handleInstantUnload = () => {
      if (globalChannel) {
        try {
          globalChannel.untrack();
        } catch (e) {}
        supabase.removeChannel(globalChannel);
      }
    };

    window.addEventListener('beforeunload', handleInstantUnload);
    window.addEventListener('pagehide', handleInstantUnload);

    return () => {
      window.removeEventListener('beforeunload', handleInstantUnload);
      window.removeEventListener('pagehide', handleInstantUnload);
    };
  }, [user?.id]);

  return { onlineUsers };
}

// Helper to check if a specific user is online
export function isUserOnline(onlineUsers: Set<string>, targetUserId: string | null | undefined): boolean {
  if (!targetUserId) return false;
  return onlineUsers.has(targetUserId);
}

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
let cleanupTimeout: any = null;

// Clean helper to remove/destroy the global channel and cancel pending timeouts cleanly
function removeGlobalChannel() {
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
    cleanupTimeout = null;
  }
  if (globalChannel) {
    // Explicitly call untrack to broadcast immediate presence leave to other users
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
  const [isTabVisible, setIsTabVisible] = useState(document.visibilityState === 'visible');

  // Track tab visibility changes reactively with a small delay to prevent aggressive disconnects on mobile
  useEffect(() => {
    let timeoutId: any = null;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setIsTabVisible(true);
      } else {
        // Wait 3 seconds before marking as invisible (aggression guard for mobile browsers)
        timeoutId = setTimeout(() => {
          setIsTabVisible(false);
        }, 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timeoutId) clearTimeout(timeoutId);
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

    // Cancel any pending unmount cleanup timeouts
    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = null;
    }

    // Initialize the shared presence channel if it doesn't exist
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

      // If no other components are active, wait a brief moment before removing the channel.
      // This 3-second buffer prevents unnecessary disconnects and reconnects during page transitions.
      if (listeners.size === 0 && globalChannel) {
        cleanupTimeout = setTimeout(() => {
          removeGlobalChannel();
        }, 3000);
      }
    };
  }, [user?.id, isTabVisible]);

  return { onlineUsers };
}

// Helper to check if a specific user is online
export function isUserOnline(onlineUsers: Set<string>, targetUserId: string | null | undefined): boolean {
  if (!targetUserId) return false;
  return onlineUsers.has(targetUserId);
}

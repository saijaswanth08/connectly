import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

const getStoredSession = (): Session | null => {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!key) return null;
    const data = localStorage.getItem(key);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed && parsed.expires_at) {
      const isExpired = parsed.expires_at * 1000 < Date.now();
      if (isExpired) return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => getStoredSession());
  const [user, setUser] = useState<User | null>(() => getStoredSession()?.user || null);
  const [loading, setLoading] = useState(() => !getStoredSession());

  useEffect(() => {
    let mounted = true;

    // 1. Initial session check from localStorage — fast, no network needed.
    //    Sets loading=false immediately so the UI doesn't block on the spinner.
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.error("[useAuth] getSession error:", error.message);
          } else if (session) {
            setSession(session);
            setUser(session.user);
          }
          // Resolve loading immediately from cached session data
          // so ProtectedRoute doesn't block on the auth spinner.
          setLoading(false);
        }
      } catch (error) {
        console.error("[useAuth] getSession exception:", error instanceof Error ? error.message : String(error));
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // 2. onAuthStateChange is the source of truth for all auth events.
    //    Keep it SYNCHRONOUS — do not await anything inside this callback.
    //    Profile upsert is fire-and-forget to avoid blocking auth state updates.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fire-and-forget profile creation on sign-in (do NOT await here)
      if (session?.user) {
        const u = session.user;
        
        // 1. Check if profile already exists to prevent overwriting user data (like avatar_url)
        supabase
          .from("profiles")
          .select("id")
          .eq("id", u.id)
          .maybeSingle()
          .then(({ data: existing }) => {
            // 2. Only insert if profile is completely missing
            if (!existing) {
              supabase
                .from("profiles")
                .insert({
                  id: u.id,
                  name: u.user_metadata?.full_name || u.user_metadata?.name || "",
                  email: u.email ?? ""
                })
                .then(({ error }) => {
                  if (error) console.error("[useAuth] profile insert error:", error.message);
                });
            }
          });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Step 1: Clear all Supabase tokens from storage immediately.
    // This ensures getSession() returns null on the next page load.
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => sessionStorage.removeItem(k));

    // Step 2: Fire server-side revocation in the background.
    // Do NOT await — and do NOT call setUser/setSession(null) before the
    // redirect. Updating React state here causes ProtectedRoute to see
    // user=null and flash the /login page for a frame before the redirect.
    supabase.auth.signOut({ scope: "global" }).catch((err) => {
      console.error("[signOut] Supabase signOut error:", err);
    });

    // Step 3: Immediately hard-redirect to landing page. The full page reload
    // wipes all React state, query cache, and Supabase client memory cleanly.
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

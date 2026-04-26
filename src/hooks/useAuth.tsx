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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session check from localStorage — fast, no network needed.
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
        }
      } catch (error: any) {
        console.error("[useAuth] getSession exception:", error.message);
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
          .single()
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
    // Step 1: Immediately clear all Supabase tokens from storage.
    // This is the most important step — do it first so the redirect
    // to /login won't bounce back to /dashboard even if the API call fails.
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => sessionStorage.removeItem(k));

    // Step 2: Clear React state immediately
    setUser(null);
    setSession(null);

    // Step 3: Tell Supabase to sign out locally (scope:'local' = no network needed).
    // Fire-and-forget — we don't wait for this so the redirect is instant.
    supabase.auth.signOut({ scope: "local" }).catch((err) => {
      console.error("[signOut] Supabase signOut error (non-blocking):", err);
    });

    // Step 4: Hard redirect to login. Using href to force a full page reload
    // so all React state, query cache, and Supabase client memory is cleared.
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

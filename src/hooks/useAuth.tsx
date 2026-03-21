import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

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

    // 1. Initial session check
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("INITIAL SESSION:", session);
        if (mounted) {
          if (error) throw error;
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error: any) {
        console.error("Error checking auth session:", error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AUTH EVENT:", event, session?.user?.id);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Upsert profile whenever a user is present (Google OAuth metadata handling)
        if (session?.user) {
          const { user } = session;
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              name: user.user_metadata?.full_name || user.user_metadata?.name || "",
              email: user.email ?? "",
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            },
            { onConflict: "id" }
          );
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

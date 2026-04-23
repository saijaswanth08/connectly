import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Only block with a spinner if we're loading AND there is a stored session
  // token hint (i.e., the user might already be logged in). This prevents the
  // login form from being invisible when Supabase is slow to hydrate.
  const hasStoredSession = Object.keys(localStorage).some((k) =>
    k.startsWith("sb-") && k.endsWith("-auth-token")
  );

  if (loading && hasStoredSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    const redirectTo = new URLSearchParams(location.search).get("redirect") || "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

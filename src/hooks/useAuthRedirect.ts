import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * A custom hook that automatically redirects authenticated users to the dashboard.
 * This is useful for public-facing pages like Landing, Login, and Signup.
 */
export function useAuthRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If auth is finished and we have a user, head to the dashboard
    if (!loading && user) {
      console.log("[useAuthRedirect] User detected, navigating to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);
}

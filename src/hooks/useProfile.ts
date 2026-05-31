import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (user?.id && data) {
        localStorage.setItem(`connectly-profile-cache-${user.id}`, JSON.stringify(data));
      }
      return data;
    },
    initialData: () => {
      if (typeof window !== "undefined" && user?.id) {
        try {
          const cached = localStorage.getItem(`connectly-profile-cache-${user.id}`);
          if (cached) return JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse cached profile", e);
        }
      }
      return undefined;
    },
  });
}

import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export default function PublicProfilePage() {
  const { id } = useParams();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <img
        src={profile.avatar_url}
        alt="avatar"
        style={{ width: 120, borderRadius: "50%" }}
      />
      <h2>{profile.name}</h2>
      <p>{profile.email}</p>
      <p>{profile.job_title} @ {profile.company}</p>
      <p>{profile.phone}</p>
      <p>{(profile as unknown as { linkedin?: string }).linkedin}</p>
      <p>{profile.instagram}</p>
    </div>
  );
}

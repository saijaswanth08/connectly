import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Linkedin, Instagram, Mail, Phone, UserPlus, Zap } from "lucide-react";
import { useState } from "react";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("username", username!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const handleAddContact = async () => {
    if (!user?.id || !profile) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("contacts").insert({
        user_id: user.id,
        name: profile.name || username || "",
        email: profile.email || "",
        phone: profile.phone || "",
        company: profile.company || "",
        job_title: profile.job_title || "",
        linkedin_url: profile.linkedin_url || "",
        notes: profile.bio || "",
      });
      if (error) throw error;
      toast({ title: "Contact added!", description: `${profile.name} has been added to your contacts.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 gap-4">
        <Zap className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Profile not found</h1>
        <p className="text-muted-foreground text-sm">This Connectly profile doesn't exist.</p>
      </div>
    );
  }

  const fullName = profile.name || username || "";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border/50 shadow-lg overflow-hidden">
        {/* Header gradient */}
        <div className="h-24 bg-gradient-to-br from-primary/80 to-primary" />

        <div className="px-6 pb-6 -mt-12 space-y-4">
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-24 w-24 border-4 border-card shadow-md">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={fullName} />}
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{fullName}</h1>
              {(profile.job_title || profile.company) && (
                <p className="text-sm text-muted-foreground">
                  {profile.job_title}{profile.job_title && profile.company ? " at " : ""}{profile.company}
                </p>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground max-w-xs">{profile.bio}</p>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-2 pt-2">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{profile.email}</span>
              </a>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>{profile.phone}</span>
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                <Linkedin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{profile.linkedin_url}</span>
              </a>
            )}
            {profile.instagram && (
              <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                <Instagram className="h-4 w-4 text-primary shrink-0" />
                <span>{profile.instagram}</span>
              </a>
            )}
          </div>

          {/* Add Contact Button */}
          {user && profile.id !== user.id && (
            <Button onClick={handleAddContact} disabled={adding} className="w-full gap-2 mt-4">
              <UserPlus className="h-4 w-4" /> {adding ? "Adding..." : "Add to My Contacts"}
            </Button>
          )}

          {!user && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                <a href="/signup" className="text-primary hover:underline">Sign up for Connectly</a> to add this contact.
              </p>
            </div>
          )}

          {/* Branding */}
          <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-border/30">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-[11px] text-muted-foreground">Powered by Connectly</span>
          </div>
        </div>
      </div>
    </div>
  );
}

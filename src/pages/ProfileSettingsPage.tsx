import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Save, ImagePlus, Trash2, Mail, Phone, Linkedin, Instagram, Building2, Briefcase } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [form, setForm] = useState({
    name: "", phone: "", linkedin_url: "", instagram: "", company: "", job_title: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        linkedin_url: profile.linkedin_url || "",
        instagram: profile.instagram || "",
        company: profile.company || "",
        job_title: profile.job_title || "",
      });
      initialized.current = true;
    }
  }, [profile]);

  const email = profile?.email || user?.email || "";
  const fullName = form.name || user?.email?.split("@")[0] || "";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url || null;

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: form.name, phone: form.phone, linkedin_url: form.linkedin_url,
        instagram: form.instagram, company: form.company, job_title: form.job_title,
      }).eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile updated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Photo updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.id) return;
    try {
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Photo removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-lg font-medium text-muted-foreground">Settings</p>
        <h1 className="text-2xl font-display font-bold text-foreground">Profile Settings</h1>
      </div>

      {/* Profile Photo */}
      <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
        <h2 className="font-display font-semibold">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={handleDeletePhoto} disabled={!avatarUrl}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleUploadPhoto} />
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
        <h2 className="font-display font-semibold">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Full Name</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1"><Mail className="h-3 w-3" /> Email Address</Label>
            <Input value={email} disabled className="rounded-lg bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 XXXXXXXXXX" className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn Profile</Label>
            <Input value={form.linkedin_url} onChange={(e) => update("linkedin_url", e.target.value)} placeholder="linkedin.com/in/username" className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</Label>
            <Input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@your_handle" className="rounded-lg" />
          </div>
        </div>
      </div>

      {/* Company / Role */}
      <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
        <h2 className="font-display font-semibold">Company & Role</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1"><Building2 className="h-3 w-3" /> Company</Label>
            <Input value={form.company} onChange={(e) => update("company", e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1"><Briefcase className="h-3 w-3" /> Role / Position</Label>
            <Input value={form.job_title} onChange={(e) => update("job_title", e.target.value)} className="rounded-lg" />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

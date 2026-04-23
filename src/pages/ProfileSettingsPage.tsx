import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { updateProfile } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Save, ImagePlus, Trash2, Mail, Phone,
  Linkedin, Instagram, Building2, Briefcase, X
} from "lucide-react";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin: string | null;   // frontend field name only
  instagram: string | null;
  avatar_url: string | null;
  created_at: string;
};

// Shape of the raw row Supabase returns (mirrors actual DB columns)
type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin_url: string | null; // actual DB column
  instagram: string | null;
  avatar_url: string | null;
  created_at: string;
};

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Cast raw Supabase response to known DB shape
      const row = data as ProfileRow;

      // Map DB columns → frontend Profile type (linkedin_url → linkedin)
      return {
        id: row.id,
        name: row.name ?? null,
        email: row.email ?? null,
        phone: row.phone ?? null,
        company: row.company ?? null,
        job_title: row.job_title ?? null,
        linkedin: row.linkedin_url ?? null,
        instagram: row.instagram ?? null,
        avatar_url: row.avatar_url ?? null,
        created_at: row.created_at,
      } satisfies Profile;
    },
    enabled: !!user?.id,
  });

  const [form, setForm] = useState({
    name: "", phone: "", linkedin_url: "", instagram: "", company: "", job_title: "",
  });
  const [originalForm, setOriginalForm] = useState({ ...form });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      const values = {
        name: profile.name || "",
        phone: profile.phone || "",
        linkedin_url: profile.linkedin || "",
        instagram: profile.instagram || "",
        company: profile.company || "",
        job_title: profile.job_title || "",
      };
      setForm(values);
      setOriginalForm(values);
      initialized.current = true;
    }
  }, [profile]);

  const email = profile?.email || user?.email || "";
  const fullName = form.name || user?.email?.split("@")[0] || "";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url || null;

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleCancel = () => {
    setForm(originalForm);
  };

  const handleSave = async (): Promise<void> => {
    if (!user?.id) {
      console.warn("[ProfileSettings] handleSave aborted: user ID is missing");
      return;
    }

    setSaving(true);

    try {
      await updateProfile({
        name: form.name || undefined,
        phone: form.phone || undefined,
        linkedin: form.linkedin_url || undefined,
        instagram: form.instagram || undefined,
        company: form.company || undefined,
        job_title: form.job_title || undefined,
      });

      setOriginalForm(form);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile updated successfully" });
    } catch (err: any) {
      console.error("PROFILE SAVE ERROR:", err);
      toast({
        title: "Error",
        description:
          err?.message ||
          err?.details ||
          err?.hint ||
          JSON.stringify(err),
        variant: "destructive",
      });
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading photo";
      toast({ title: "Error", description: msg, variant: "destructive" });
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error removing photo";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Page Title */}
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium">Account</p>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">Manage how you appear on Connectly</p>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        {/* Avatar + Identity */}
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-card shadow-md ring-2 ring-primary/20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="mb-1">
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                {fullName || "Your Name"}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {email || "—"}
              </p>
              {form.job_title && form.company && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {form.job_title} @ {form.company}
                </p>
              )}
            </div>
          </div>

          {/* Photo Buttons */}
          <div className="flex gap-2 sm:mb-1">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleUploadPhoto} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Upload Photo"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={handleDeletePhoto}
              disabled={!avatarUrl}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-semibold text-foreground">Personal Information</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Your basic details visible across Connectly</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Your full name"
              className="rounded-lg h-9"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email Address
            </Label>
            <Input
              value={email}
              disabled
              className="rounded-lg h-9 bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Phone Number
            </Label>
            <Input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+91 XXXXXXXXXX"
              className="rounded-lg h-9"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Linkedin className="h-3 w-3" /> LinkedIn Profile
            </Label>
            <Input
              value={form.linkedin_url}
              onChange={(e) => update("linkedin_url", e.target.value)}
              placeholder="linkedin.com/in/username"
              className="rounded-lg h-9"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5 sm:col-span-2 sm:max-w-[calc(50%-8px)]">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Instagram className="h-3 w-3" /> Instagram
            </Label>
            <Input
              value={form.instagram}
              onChange={(e) => update("instagram", e.target.value)}
              placeholder="@your_handle"
              className="rounded-lg h-9"
            />
          </div>
        </div>
      </div>

      {/* Company & Role */}
      <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-semibold text-foreground">Company & Role</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Where you work and what you do</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Company
            </Label>
            <Input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Company name"
              className="rounded-lg h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Role / Position
            </Label>
            <Input
              value={form.job_title}
              onChange={(e) => update("job_title", e.target.value)}
              placeholder="Your job title"
              className="rounded-lg h-9"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[130px]">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

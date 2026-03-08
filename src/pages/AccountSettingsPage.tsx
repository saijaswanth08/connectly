import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, ImagePlus, Trash2, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Initialize form when profile loads
  const initialized = useRef(false);
  if (profile && !initialized.current) {
    setName(profile.name || "");
    setEmail(profile.email || "");
    initialized.current = true;
  }

  const fullName = profile?.name || user?.email?.split("@")[0] || "";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url || null;

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ name, email }).eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile updated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast({ title: "New password is required", variant: "destructive" });
      return;
    }

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters and include letters and numbers.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setChangingPw(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Session expired",
          description: "Your session has expired. Please login again to change your password.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: "Password Updated Successfully",
        description: "Your Connectly account password has been changed.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      if (String(e?.message || "").toLowerCase().includes("session")) {
        toast({
          title: "Session expired",
          description: "Your session has expired. Please login again to change your password.",
          variant: "destructive",
        });
        navigate("/login");
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } finally {
      setChangingPw(false);
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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">Account Settings</h1>
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

      {/* Profile Info */}
      <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
        <h2 className="font-display font-semibold">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Reset Password via Email */}
      <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold">Reset Password</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          For security reasons, password changes require email verification. We'll send a secure reset link to your registered email address.
        </p>
        {resetSent ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Reset link sent!</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Check your inbox at <strong className="text-foreground">{email}</strong> and click the link to set a new password. The link expires in 60 minutes.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setResetSent(false)}
            >
              Send again
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{email}</span>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              disabled={sendingReset}
              onClick={async () => {
                if (!email) {
                  toast({ title: "No email found", variant: "destructive" });
                  return;
                }
                setSendingReset(true);
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                setSendingReset(false);
                if (error) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                } else {
                  setResetSent(true);
                  toast({ title: "Reset link sent!", description: "Check your email inbox." });
                }
              }}
            >
              <Mail className="h-4 w-4" />
              {sendingReset ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

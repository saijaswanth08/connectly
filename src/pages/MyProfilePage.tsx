import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Save, Share2, Copy, Download, QrCode, Linkedin, Instagram, Mail, Phone, ImagePlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function MyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const qrRef = useRef<HTMLDivElement>(null);
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
    name: "", email: "", phone: "", linkedin_url: "", instagram: "",
    bio: "", company: "", job_title: "", username: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: (profile as any).phone || "",
        linkedin_url: (profile as any).linkedin_url || "",
        instagram: (profile as any).instagram || "",
        bio: (profile as any).bio || "",
        company: (profile as any).company || "",
        job_title: (profile as any).job_title || "",
        username: (profile as any).username || "",
      });
      initialized.current = true;
    }
  }, [profile]);

  const profileUrl = form.username
    ? `${window.location.origin}/profile/${form.username}`
    : "";

  const fullName = form.name || user?.email?.split("@")[0] || "";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url || null;

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!user?.id) return;
    if (!form.username.match(/^[a-z0-9_-]{3,30}$/)) {
      toast({ title: "Username must be 3-30 chars: lowercase letters, numbers, hyphens, underscores", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: form.name, email: form.email,
        phone: form.phone, linkedin_url: form.linkedin_url, instagram: form.instagram,
        bio: form.bio, company: form.company, job_title: form.job_title, username: form.username,
      } as any).eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile saved!" });
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

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({ title: "Profile link copied!" });
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = `connectly-qr-${form.username}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your professional profile and share it with others.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo + Name */}
          <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-20 w-20 border-2 border-border">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                  <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImagePlus className="h-5 w-5 text-white" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleUploadPhoto} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Full Name</Label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Username</Label>
                    <Input value={form.username} onChange={(e) => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="e.g. saijashuu" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
            <h2 className="font-display font-semibold text-sm">Professional Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Company</Label>
                <Input value={form.company} onChange={(e) => update("company", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role / Position</Label>
                <Input value={form.job_title} onChange={(e) => update("job_title", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Short Bio</Label>
              <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell people about yourself..." rows={3} />
            </div>
          </div>

          {/* Contact & Social */}
          <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
            <h2 className="font-display font-semibold text-sm">Contact & Social</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 XXXXXXXXXX" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn</Label>
                <Input value={form.linkedin_url} onChange={(e) => update("linkedin_url", e.target.value)} placeholder="linkedin.com/in/username" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</Label>
                <Input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@your_handle" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={!form.username}>
                  <Share2 className="h-4 w-4" /> Share Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={profileUrl} readOnly className="text-sm" />
                    <Button variant="outline" size="icon" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
                  </div>
                  {profileUrl && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div ref={qrRef}>
                        <QRCodeSVG value={profileUrl} size={200} level="H" />
                      </div>
                      <p className="text-xs text-muted-foreground">Scan to view my profile</p>
                      <Button variant="outline" size="sm" className="gap-2" onClick={downloadQR}>
                        <Download className="h-4 w-4" /> Download QR Code
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Preview Card + QR */}
        <div className="space-y-6">
          <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
            <h2 className="font-display font-semibold text-sm">Profile Preview</h2>
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="h-16 w-16 border-2 border-border">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-display font-bold">{form.name || "Your Name"}</p>
                {(form.job_title || form.company) && (
                  <p className="text-xs text-muted-foreground">
                    {form.job_title}{form.job_title && form.company ? " at " : ""}{form.company}
                  </p>
                )}
              </div>
              {form.email && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{form.email}</span>
              )}
              {form.phone && (
                <span className="text-xs text-muted-foreground">{form.phone}</span>
              )}
              <div className="flex gap-3 pt-1">
                {form.email && <Mail className="h-4 w-4 text-muted-foreground" />}
                {form.phone && <Phone className="h-4 w-4 text-muted-foreground" />}
                {form.linkedin_url && <Linkedin className="h-4 w-4 text-muted-foreground" />}
                {form.instagram && <Instagram className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </div>

          {form.username && profileUrl && (
            <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
              <h2 className="font-display font-semibold text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" /> My Connectly QR
              </h2>
              <div className="flex flex-col items-center gap-3" ref={qrRef}>
                <QRCodeSVG value={profileUrl} size={160} level="H" />
                <p className="text-xs text-muted-foreground text-center">Scan to view my profile and connect with me.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadQR}>
                    <Download className="h-3 w-3" /> Download
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={copyLink}>
                    <Copy className="h-3 w-3" /> Copy Link
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

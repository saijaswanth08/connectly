import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail, Phone, Building2, Briefcase, Save,
  ImagePlus, Trash2, Linkedin, Instagram, QrCode, Download,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function MyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const modalQrRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

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
    name: "", email: "", company: "", job_title: "", phone: "",
    linkedin_url: "", instagram: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setForm({
        name: profile.name || "",
        email: profile.email || user?.email || "",
        company: (profile as any).company || "",
        job_title: (profile as any).job_title || "",
        phone: (profile as any).phone || "",
        linkedin_url: (profile as any).linkedin_url || "",
        instagram: (profile as any).instagram || "",
      });
      initialized.current = true;
    }
  }, [profile, user]);

  const fullName = form.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = (profile as any)?.avatar_url || null;

  // Build a shareable profile URL for the QR code
  const buildQrUrl = useCallback(() => {
    const identifier = (profile as any)?.username || user?.id;
    if (!identifier) return "";
    const base = `${window.location.protocol}//${window.location.host}`;
    return `${base}/profile/${identifier}`;
  }, [profile, user]);

  const handleGenerateQr = () => {
    const url = buildQrUrl();
    if (!url) {
      toast({ title: "Profile not ready", description: "Save your profile at least once before generating a QR code.", variant: "destructive" });
      return;
    }
    setQrValue(url);
    setShowQrModal(true);
  };

  const handleDownloadQr = (ref: React.RefObject<HTMLDivElement>) => {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) {
      toast({ title: "Generate a QR code first", variant: "destructive" });
      return;
    }
    const link = document.createElement("a");
    link.download = `${fullName.replace(/\s+/g, "_")}_QRCode.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: form.name,
        email: form.email,
        company: form.company,
        job_title: form.job_title,
        phone: form.phone,
        linkedin_url: form.linkedin_url,
        instagram: form.instagram,
      } as any).eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile updated successfully!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile photo updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;
    try {
      await supabase.from("profiles").update({ avatar_url: null } as any).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile photo removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

      {/* Page Title */}
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium">Account</p>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your information and share your profile via QR code</p>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500/20 via-indigo-400/10 to-transparent" />
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            {/* Clickable avatar */}
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload photo"
            >
              <Avatar className="h-20 w-20 border-4 border-card shadow-md ring-2 ring-indigo-500/20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="mb-1">
              <h2 className="text-lg font-semibold text-foreground leading-tight">{fullName}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {form.email || "—"}
              </p>
              {form.job_title && form.company && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {form.job_title} @ {form.company}
                </p>
              )}
            </div>
          </div>

          {/* Upload / Remove */}
          <div className="flex gap-2 sm:mb-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUploadPhoto}
            />
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"
              onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Upload Photo"}
            </Button>
            <Button variant="outline" size="sm"
              className="gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={handleRemovePhoto} disabled={!avatarUrl || uploading}>
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-semibold text-foreground">Account Information</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Update your contact and workplace details</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name" className="rounded-lg h-9" />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email Address
            </Label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" className="rounded-lg h-9" />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Company
            </Label>
            <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
              placeholder="Company name" className="rounded-lg h-9" />
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Job Title
            </Label>
            <Input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })}
              placeholder="Your role" className="rounded-lg h-9" />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Phone Number
            </Label>
            <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 XXXXXXXXXX" className="rounded-lg h-9" />
          </div>

          {/* LinkedIn */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Linkedin className="h-3 w-3" /> LinkedIn URL
            </Label>
            <Input value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
              placeholder="linkedin.com/in/username" className="rounded-lg h-9" />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5 sm:col-span-2 sm:max-w-[calc(50%-8px)]">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Instagram className="h-3 w-3" /> Instagram
            </Label>
            <Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })}
              placeholder="@your_handle" className="rounded-lg h-9" />
          </div>
        </div>

        {/* Save */}
        <div className="pt-2">
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2 min-w-[130px]">
            <Save className="h-4 w-4" />
            {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* QR Code Card */}
      <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <QrCode className="h-4 w-4 text-indigo-500" />
            Profile QR Code
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate a QR code containing your professional details for others to scan
          </p>
        </div>

        {/* QR Display */}
        {qrValue ? (
          <div className="flex justify-center">
            <div
              ref={qrRef}
              className="p-4 bg-white rounded-xl border border-border/40 shadow-sm inline-block"
            >
              <QRCodeCanvas
                value={qrValue}
                size={180}
                bgColor="#ffffff"
                fgColor="#1e1b4b"
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-36 rounded-xl border border-dashed border-border/60 bg-muted/20">
            <div className="text-center space-y-1">
              <QrCode className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">Click "Generate QR Code" to create your QR</p>
            </div>
          </div>
        )}

        {/* QR Buttons */}
        <div className="flex items-center gap-3">
          <Button onClick={handleGenerateQr} variant="outline" className="gap-2">
            <QrCode className="h-4 w-4" />
            Generate QR Code
          </Button>
          <Button onClick={() => handleDownloadQr(qrRef)} disabled={!qrValue} className="gap-2">
            <Download className="h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </div>

      {/* ── QR Code Modal ── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative bg-card rounded-3xl shadow-2xl border border-border/60 p-8 flex flex-col items-center gap-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Title */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-500" />
                Your Profile QR Code
              </h2>
              <p className="text-xs text-muted-foreground">Scan to view {fullName}'s profile</p>
            </div>

            {/* Large QR */}
            <div
              ref={modalQrRef}
              className="p-5 bg-white rounded-2xl border border-border/30 shadow-md"
            >
              <QRCodeCanvas
                value={qrValue}
                size={280}
                bgColor="#ffffff"
                fgColor="#1e1b4b"
                level="M"
                includeMargin={false}
              />
            </div>

            {/* URL label */}
            <p className="text-[11px] text-muted-foreground text-center truncate max-w-full px-2">
              {qrValue}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={() => handleDownloadQr(modalQrRef)}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setShowQrModal(false)}
              >
                ← Back
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

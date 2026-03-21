import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail, Phone, Building2, Briefcase, Save,
  ImagePlus, Trash2, Linkedin, Instagram, QrCode, Download, LogOut,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Skeleton } from "@/components/ui/skeleton";
import { QRProfileCard } from "@/components/QRProfileCard";
import { cn } from "@/lib/utils";

export default function MyProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
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
      const p = profile as Record<string, unknown>;
      setForm({
        name: profile.name || "",
        email: profile.email || user?.email || "",
        company: (p.company as string) || "",
        job_title: (p.job_title as string) || "",
        phone: (p.phone as string) || "",
        linkedin_url: (p.linkedin_url as string) || "",
        instagram: (p.instagram as string) || "",
      });
      initialized.current = true;
    }
  }, [profile, user]);

  const fullName = form.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile ? (profile as Record<string, unknown>).avatar_url as string : null;

  // Build a shareable profile URL for the QR code
  const buildQrUrl = useCallback(() => {
    const identifier = profile ? (profile as Record<string, unknown>).username as string : user?.id;
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

  const handleDownloadQr = async (ref: React.RefObject<HTMLDivElement>) => {
    const qrCanvas = ref.current?.querySelector("canvas");
    if (!qrCanvas) {
      toast({ title: "Error", description: "QR Code not found", variant: "destructive" });
      return;
    }

    try {
      toast({ title: "Generating QR Card...", description: "Please wait while we prepare your high-quality card." });

      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1100;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Dark Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGrad.addColorStop(0, "#1a1c2c");
      bgGrad.addColorStop(0.5, "#4a192c");
      bgGrad.addColorStop(1, "#0a0a0c");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative blur spheres (emulated via gradients)
      const drawSphere = (x: number, y: number, r: number, color: string) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };
      drawSphere(200, 200, 400, "rgba(147, 51, 234, 0.2)");
      drawSphere(800, 900, 400, "rgba(37, 99, 235, 0.2)");

      // 2. Glassmorphism Card Effect
      const cardX = 100;
      const cardY = 100;
      const cardW = 700;
      const cardH = 900;
      const radius = 50;

      // Card Shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 64;
      ctx.shadowOffsetY = 32;
      
      // Card Background (Semi-transparent)
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();
      
      // Card Border
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Branding (Top)
      const drawLogo = (lx: number, ly: number, size: number) => {
          const s = (v: number) => (v * size) / 40;
          const grad = ctx.createLinearGradient(lx, ly, lx + size, ly + size);
          grad.addColorStop(0, "#5B7CFA");
          grad.addColorStop(1, "#8B5CF6");
          ctx.fillStyle = grad;
          ctx.strokeStyle = grad;
          ctx.lineWidth = s(3);
          ctx.lineCap = "round";

          // Nodes
          const nodes = [[8, 10, 5], [32, 10, 5], [20, 32, 5.5]];
          nodes.forEach(([nx, ny, nr]) => {
              ctx.beginPath();
              ctx.arc(lx + s(nx), ly + s(ny), s(nr), 0, Math.PI * 2);
              ctx.fill();
          });
          // Connections
          ctx.beginPath();
          ctx.moveTo(lx + s(8), ly + s(14));
          ctx.lineTo(lx + s(20), ly + s(28));
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(lx + s(32), ly + s(14));
          ctx.lineTo(lx + s(20), ly + s(28));
          ctx.stroke();
      };
      drawLogo(canvas.width / 2 - 35, 140, 70);

      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.font = "bold 36px Inter, system-ui, sans-serif";
      ctx.fillText("Connectly", canvas.width / 2, 250);
      
      // 4. Name Section
      ctx.fillStyle = "white";
      ctx.font = "bold 44px Inter";
      ctx.fillText(fullName, canvas.width / 2, 380);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "500 22px Inter";
      ctx.fillText("Connect with me on Connectly", canvas.width / 2, 425);

      // 5. QR Code Section
      const qrSize = 320;
      const qrPadding = 30;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 540;

      // QR Container
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.roundRect(qrX - qrPadding, qrY - qrPadding, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 32);
      ctx.fill();

      // Border for QR Container
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw the QR Code canvas content
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // 6. Footer
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "500 24px Inter";
      ctx.fillText("Scan to connect", canvas.width / 2, 970);

      // Export
      const p = profile as Record<string, unknown>;
      const username = (p?.username as string) || fullName.replace(/\s+/g, "_");
      const fileName = `${username}_ConnectlyQR.png`;
      
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({ title: "Export Failed", description: "Could not generate image blob.", variant: "destructive" });
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success!", description: "Your QR card has been downloaded." });
      }, "image/png");
    } catch (err) {
      console.error("QR Export failed:", err);
      toast({ title: "Export Failed", description: "There was an error generating your image.", variant: "destructive" });
    }
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
      } as Record<string, unknown>).eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile updated successfully!" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
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
      await supabase.from("profiles").update({ avatar_url: publicUrl } as Record<string, unknown>).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile photo updated!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;
    try {
      await supabase.from("profiles").update({ avatar_url: null } as Record<string, unknown>).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profile photo removed" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // ── State 1: Auth is still being resolved ──────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Checking authentication…</span>
        </div>
      </div>
    );
  }

  // ── State 2: Not logged in ───────────────────────────────────────────────
  if (!user) {
    const handleOAuth = (provider: "google" | "github") =>
      supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm rounded-2xl bg-card border border-border/60 shadow-lg p-8 space-y-6 text-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to view and edit your profile
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full gap-2 bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
              variant="outline"
              onClick={() => handleOAuth("google")}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={() => handleOAuth("github")}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Continue with GitHub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── State 3: Profile data still loading from DB ──────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6 animate-in fade-in duration-500">
        <div className="space-y-0.5">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="space-y-2 mb-1 flex-1">
              <Skeleton className="h-6 w-48 max-w-full" />
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="h-3 w-40 max-w-full mt-2" />
            </div>
          </div>
          <div className="flex gap-2 sm:mb-1">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full rounded-md" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full rounded-md" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full rounded-md" /></div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full rounded-md" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-full rounded-md" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full rounded-md" /></div>
          </div>
        </div>
        <div className="space-y-2 pt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

      {/* Page Title */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
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

          {/* Upload / Remove / Logout */}
          <div className="flex gap-2 sm:mb-1 flex-wrap">
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
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs ml-auto"
              onClick={async () => {
                await signOut();
                toast({ title: "Signed out", description: "You have been signed out." });
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
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
                className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              >
                <Download className="h-4 w-4" />
                Download PNG
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

      {/* Hidden QR Card Template for Export */}
      {qrValue && (
        <QRProfileCard
          id="qr-profile-card-export"
          qrValue={qrValue}
          fullName={fullName}
        />
      )}

    </div>
  );
}

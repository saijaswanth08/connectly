import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { updateProfile } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save, ImagePlus, Trash2, Mail, Phone,
  Linkedin, Instagram, Building2, Briefcase, X, QrCode, Download, Lock
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { QRProfileCard } from "@/components/QRProfileCard";

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
  daily_digest_enabled: boolean;
};

// Shape of the raw row Supabase returns (mirrors actual DB columns)
type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin: string | null; // actual DB column
  instagram: string | null;
  avatar_url: string | null;
  created_at: string;
  daily_digest_enabled: boolean;
};

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useProfile();

  const [form, setForm] = useState({
    name: "", phone: "", linkedin: "", instagram: "", company: "", job_title: "", daily_digest_enabled: true,
  });
  const [originalForm, setOriginalForm] = useState({ ...form });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const initialized = useRef(false);

  // QR Code States
  const [qrValue, setQrValue] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const modalQrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile && !initialized.current) {
      const values = {
        name: profile.name || "",
        phone: profile.phone || "",
        linkedin: profile.linkedin_url || "",
        instagram: profile.instagram || "",
        company: profile.company || "",
        job_title: profile.job_title || "",
        daily_digest_enabled: profile.daily_digest_enabled ?? true,
      };
      setForm(values);
      setOriginalForm(values);
      initialized.current = true;

      // If the profile already has all required fields, consider it "saved"
      const alreadyComplete = !!(profile.name && profile.company && profile.job_title && profile.phone);
      if (alreadyComplete) {
        setProfileSaved(true);
      }
    }
  }, [profile]);

  // Check if profile is complete based on saved values (originalForm)
  const isProfileComplete = !!(
    originalForm.company &&
    originalForm.job_title &&
    originalForm.phone &&
    originalForm.name
  );

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(originalForm);
  }, [form, originalForm]);

  // QR section is unlocked only when profile is saved and no unsaved changes
  const isQrUnlocked = profileSaved && isProfileComplete && !hasUnsavedChanges;



  const email = profile?.email || user?.email || "";
  const fullName = form.name || user?.email?.split("@")[0] || "";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url || null;
  const update = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const handleCancel = () => {
    setForm(originalForm);
  };

  const handleGenerateQr = () => {
    // 1. Verify all required professional details are filled
    const requiredFields = [
      { key: "name", label: "Full Name" },
      { key: "company", label: "Company" },
      { key: "job_title", label: "Job Title" },
      { key: "phone", label: "Phone Number" },
    ];

    const missing = requiredFields.filter(f => !form[f.key as keyof typeof form]?.trim());

    if (missing.length > 0) {
      toast({
        title: "Profile Incomplete",
        description: `Please fill in your ${missing.map(m => m.label).join(", ")} to generate a professional QR code.`,
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({ 
        title: "Error", 
        description: "Could not generate profile link. Please try again.", 
        variant: "destructive" 
      });
      return;
    }

    const base = `${window.location.protocol}//${window.location.host}`;
    const url = `${base}/profile/${user.id}`;
    setQrValue(url);
    setShowQrModal(true);
    toast({
      title: "QR Code Generated!",
      description: "You can now download or share your professional profile."
    });
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

      // Decorative blur spheres
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

      const fileName = `${fullName.replace(/\s+/g, "_")}_ConnectlyQR.png`;
      
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

  const handleSave = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();

    if (!user?.id) {
      console.warn("[ProfileSettings] handleSave aborted: user ID is missing");
      return;
    }

    setSaving(true);

    try {
      await updateProfile({
        name: form.name || undefined,
        phone: form.phone || undefined,
        linkedin: form.linkedin || undefined,
        instagram: form.instagram || undefined,
        company: form.company || undefined,
        job_title: form.job_title || undefined,
        daily_digest_enabled: form.daily_digest_enabled,
      });

      setOriginalForm(form);
      setProfileSaved(true);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "Profile updated successfully" });
    } catch (err) {
      const error = err as Error & { details?: string; hint?: string };
      console.error("PROFILE SAVE ERROR:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          error.details ||
          error.hint ||
          JSON.stringify(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);

      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "Photo updated!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading photo";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.id) return;
    try {
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "Photo removed" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error removing photo";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Page Title Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Profile Header Card Skeleton */}
        <div className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
          <div className="h-24 bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-transparent" />
          <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <Skeleton className="h-20 w-20 rounded-full shrink-0 border-4 border-background shadow-md" />
              <div className="space-y-2 mb-1 flex-1">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="flex gap-2 sm:mb-1 shrink-0">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>
        </div>

        {/* Details fields grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* Biography Block Skeleton */}
        <div className="space-y-2 pt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
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
                  {user?.email?.[0]?.toUpperCase() || "U"}
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
              value={form.linkedin}
              onChange={(e) => update("linkedin", e.target.value)}
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

      {/* Preferences or QR Code Card */}
      {!isProfileComplete ? (
        <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-foreground">Preferences</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your notifications and settings</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-foreground">Daily Networking Brief</Label>
              <p className="text-xs text-muted-foreground">Receive a daily email summarizing your upcoming reminders.</p>
            </div>
            <Switch 
              checked={form.daily_digest_enabled} 
              onCheckedChange={(checked) => update("daily_digest_enabled", checked)}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500 relative overflow-hidden">
          {/* Lock Overlay – shown when QR section is not unlocked */}
          {!isQrUnlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl" style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.35)" }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-background/90 shadow-lg border border-border/60">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-white text-center px-4">
                {hasUnsavedChanges
                  ? "Save your changes to unlock the QR Code"
                  : "Fill in and save your profile details to unlock"}
              </p>
              {hasUnsavedChanges && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-white text-black hover:bg-white/90"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save Now"}
                </Button>
              )}
            </div>
          )}

          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <QrCode className="h-4 w-4 text-indigo-500" />
              Profile QR Code
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate a QR code containing your professional details for others to scan
            </p>
          </div>

          {/* Always show the dashed placeholder box on the page card */}
          <div className="flex items-center justify-center h-36 rounded-xl border border-dashed border-border/60 bg-muted/20">
            <div className="text-center space-y-1">
              <QrCode className="h-8 w-8 text-muted-foreground/40 mx-auto animate-pulse" />
              <p className="text-xs text-muted-foreground">Click "Generate QR Code" to create your QR</p>
            </div>
          </div>

          {/* Hidden QR container so download still works seamlessly */}
          {qrValue && (
            <div className="hidden" ref={qrRef}>
              <QRCodeCanvas
                value={qrValue}
                size={180}
                bgColor="#ffffff"
                fgColor="#1e1b4b"
                level="M"
                includeMargin={false}
              />
            </div>
          )}

          {/* QR Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button onClick={handleGenerateQr} variant="outline" className="gap-2 w-full sm:w-auto justify-center" disabled={!isQrUnlocked}>
              <QrCode className="h-4 w-4" />
              Generate QR Code
            </Button>
            <Button onClick={() => handleDownloadQr(qrRef)} disabled={!qrValue || !isQrUnlocked} className="gap-2 w-full sm:w-auto justify-center">
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[130px]">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
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

            <p className="text-xs text-muted-foreground/75 text-center font-medium tracking-wide italic px-2">
              "Scan this QR code to view my digital business card & professional details"
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

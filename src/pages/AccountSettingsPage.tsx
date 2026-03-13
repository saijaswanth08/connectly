import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-zA-Z]/, "Must contain a letter")
  .regex(/[0-9]/, "Must contain a number");

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ── Form state ────────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const userEmail = user?.email ?? "";

  // ── Validation ────────────────────────────────────────────────────────────
  const validateNewPw = (value: string) => {
    const result = passwordSchema.safeParse(value);
    if (!result.success) {
      setPwErrors(result.error.errors.map((e) => e.message));
      return false;
    }
    setPwErrors([]);
    return true;
  };

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate inputs
    if (!currentPw) {
      toast({ title: "Enter your current password", variant: "destructive" });
      return;
    }
    if (!validateNewPw(newPw)) return;
    if (newPw !== confirmPw) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 2. Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPw,
      });

      if (signInError) {
        toast({ title: "Incorrect current password", variant: "destructive" });
        return;
      }

      // 3. Current password is correct — update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPw,
      });

      if (updateError) throw updateError;

      // 4. Success — clear form
      toast({
        title: "Password updated successfully",
        description: "Your password has been changed.",
      });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwErrors([]);
    } catch (err: any) {
      toast({
        title: "Error updating password",
        description: err.message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Page header */}
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Account Security</h1>
          <p className="text-sm text-muted-foreground">
            Update your password to keep your account secure
          </p>
        </div>

        {/* Password card */}
        <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-6 space-y-5">

          <div className="flex items-center gap-2 pb-1 border-b border-border/40">
            <KeyRound className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-foreground">Update Password</span>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">

            {/* Current Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Current Password
              </Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Your current password"
                  className="rounded-lg h-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowCurrent((v) => !v)}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> New Password
              </Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => {
                    setNewPw(e.target.value);
                    if (pwErrors.length) validateNewPw(e.target.value);
                  }}
                  placeholder="••••••••"
                  className="rounded-lg h-10 pr-10"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwErrors.length > 0 && (
                <ul className="text-xs text-destructive space-y-0.5 mt-1">
                  {pwErrors.map((err) => (
                    <li key={err}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg h-10 pr-10"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPw && newPw && confirmPw !== newPw && (
                <p className="text-xs text-destructive mt-1">• Passwords do not match</p>
              )}
            </div>

            {/* Password requirements hint */}
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 leading-relaxed">
              Password must be at least <strong>8 characters</strong> and include a letter and a number.
            </p>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 h-10 font-medium"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? "Updating…" : "Update Password"}
            </Button>

          </form>
        </div>

      </div>
    </div>
  );
}

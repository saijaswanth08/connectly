import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ShieldCheck, Lock } from "lucide-react";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Must contain at least one letter")
  .regex(/[0-9]/, "Must contain at least one number");

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const email = profile?.email || user?.email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const validatePassword = (value: string) => {
    const result = passwordSchema.safeParse(value);
    if (!result.success) {
      setPasswordErrors(result.error.errors.map((e) => e.message));
      return false;
    }
    setPasswordErrors([]);
    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSendResetEmail = async () => {
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
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-lg font-medium text-muted-foreground">Settings</p>
        <h1 className="text-2xl font-display font-bold text-foreground">Account Settings</h1>
      </div>

      {/* Change Password */}
      <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.length) validatePassword(e.target.value);
                }}
                required
                className="rounded-lg"
              />
              {passwordErrors.length > 0 && (
                <ul className="text-xs text-destructive space-y-0.5">
                  {passwordErrors.map((err) => <li key={err}>• {err}</li>)}
                </ul>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Confirm Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>
          </div>
          <Button type="submit" disabled={changingPassword} className="gap-2">
            <Lock className="h-4 w-4" /> {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>

      {/* Reset Password via Email */}
      <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold">Reset Password via Email</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Send a secure reset link to your registered email to change your password externally.
        </p>
        {resetSent ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Reset link sent!</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Check your inbox at <strong className="text-foreground">{email}</strong>. The link expires in 60 minutes.
            </p>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setResetSent(false)}>
              Send again
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{email}</span>
            </div>
            <Button variant="outline" className="gap-2" disabled={sendingReset} onClick={handleSendResetEmail}>
              <Mail className="h-4 w-4" /> {sendingReset ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <TwoFactorSettings />
    </div>
  );
}

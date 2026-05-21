import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Check, X, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { z } from "zod";

// Password rules — same as SignupPage
const PASSWORD_RULES = [
  { id: "length",  label: "At least 8 characters",   test: (p: string) => p.length >= 8 },
  { id: "lower",   label: "One lowercase letter",     test: (p: string) => /[a-z]/.test(p) },
  { id: "upper",   label: "One uppercase letter",     test: (p: string) => /[A-Z]/.test(p) },
  { id: "number",  label: "One number",               test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character",    test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character (e.g. !@#$%)");

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Show/hide toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password strength
  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(newPassword) })),
    [newPassword]
  );
  const passwordStrength = passwordChecks.filter((r) => r.passed).length;
  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][passwordStrength];
  const strengthColor = ["bg-border", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-400", "bg-emerald-500"][passwordStrength];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate new password
    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      toast({
        title: "Password too weak",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (!user?.email) {
      toast({ title: "No email found", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Re-authenticate with current password to verify identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Incorrect current password",
          description: "Please check your current password and try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Step 2: Update the password directly (user is authenticated)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast({
          title: "Failed to update password",
          description: updateError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Success!
      setDone(true);
      toast({ title: "Password updated! 🎉", description: "Your password has been changed successfully." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Success State */}
        {done ? (
          <Card className="rounded-2xl shadow-sm border-border">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <CardTitle className="font-display text-xl font-bold text-foreground">
                Password Updated!
              </CardTitle>
              <CardDescription>
                Your password has been changed successfully. Use your new password next time you sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full rounded-full" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button variant="ghost" className="w-full rounded-full text-muted-foreground" onClick={() => {
                setDone(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}>
                Change Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl shadow-sm border-border">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-xl font-bold text-foreground">
                Change Password
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Enter your current password, then choose a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-5">

                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength bar + checklist */}
                  {newPassword.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i <= passwordStrength ? strengthColor : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strength:{" "}
                        <span className={`font-semibold ${
                          passwordStrength <= 2 ? "text-red-500" : passwordStrength === 3 ? "text-yellow-500" : "text-emerald-500"
                        }`}>
                          {strengthLabel}
                        </span>
                      </p>
                      {passwordStrength < 5 && (
                        <div className="grid grid-cols-1 gap-1 pt-1">
                          {passwordChecks.map((rule) => (
                            <div key={rule.id} className="flex items-center gap-2">
                              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${rule.passed ? "bg-emerald-500" : "bg-border"}`}>
                                {rule.passed ? <Check className="h-2.5 w-2.5 text-white" /> : <X className="h-2.5 w-2.5 text-muted-foreground" />}
                              </div>
                              <span className={`text-xs transition-colors ${rule.passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                {rule.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`rounded-lg pr-10 transition-colors ${
                        confirmPassword.length > 0
                          ? newPassword === confirmPassword
                            ? "border-emerald-500 focus-visible:ring-emerald-500"
                            : "border-red-400 focus-visible:ring-red-400"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {newPassword === confirmPassword ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs text-red-500 font-medium">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full rounded-full">
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

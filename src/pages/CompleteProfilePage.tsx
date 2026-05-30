import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Check, X, ArrowRight, Sparkles } from "lucide-react";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";
import { Skeleton } from "@/components/ui/skeleton";

// Password policy matching Supabase's requirements
const PASSWORD_RULES = [
  { id: "length",  label: "At least 8 characters",   test: (p: string) => p.length >= 8 },
  { id: "lower",   label: "One lowercase letter",     test: (p: string) => /[a-z]/.test(p) },
  { id: "upper",   label: "One uppercase letter",     test: (p: string) => /[A-Z]/.test(p) },
  { id: "number",  label: "One number",               test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character",    test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export default function CompleteProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );
  const passwordStrength = passwordChecks.filter((r) => r.passed).length;
  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][passwordStrength];
  const strengthColor = [
    "bg-border",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-400",
    "bg-emerald-500",
  ][passwordStrength];

  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  // Check if user is an existing user or already completed setup
  useEffect(() => {
    if (loading || !user) return;

    const checkStatus = async () => {
      try {
        // 1. Check if user already marked profile complete in localStorage
        const completed = localStorage.getItem(`connectly_profile_complete_${user.id}`);
        if (completed === "true") {
          navigate("/dashboard", { replace: true });
          return;
        }

        // 2. Check if user already has a password identity set (email provider)
        const hasPassword = user.identities?.some((id) => id.provider === "email");

        // 3. Check if user already has a profile record with details
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const isProfilePopulated = !!(
          profile &&
          (profile.phone || profile.company || profile.job_title || profile.avatar_url)
        );

        // 4. Check if the user account is older than 15 seconds
        const isAccountOld = user.created_at && (Date.now() - new Date(user.created_at).getTime() > 15000);

        if (hasPassword || isProfilePopulated || isAccountOld) {
          // Yes! They are an existing user. Bypass password creation entirely
          localStorage.setItem(`connectly_profile_complete_${user.id}`, "true");
          
          const oauthFlowSource = sessionStorage.getItem("oauth_flow_source");
          if (oauthFlowSource === "signup") {
            sessionStorage.setItem("show_welcome_back", "true");
          } else {
            sessionStorage.removeItem("show_welcome_back");
          }
          // Clean up oauth source tracking
          sessionStorage.removeItem("oauth_flow_source");

          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (err) {
        console.error("[CompleteProfilePage] checkStatus error:", err);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkStatus();
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const failedRules = passwordChecks.filter((r) => !r.passed);
    if (failedRules.length > 0) {
      toast({
        title: "Password doesn't meet requirements",
        description: failedRules.map((r) => r.label).join(", "),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error setting password",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Mark profile as complete
      if (user) {
        localStorage.setItem(`connectly_profile_complete_${user.id}`, "true");
      }

      toast({
        title: "Password created!",
        description: "Your account is ready. Redirecting to dashboard...",
      });

      // Small delay so the user sees the success toast
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 800);
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`connectly_profile_complete_${user.id}`, "true");
    }
    navigate("/dashboard", { replace: true });
  };

  // While auth is loading or checking existing profile, show nothing (blank)
  // — avoids the skeleton flash since the redirect happens quickly.
  if (loading || checkingExisting) {
    return null;
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground"
          >
            <ConnectlyLogoIcon size={28} />
            Connect<span className="text-primary">ly</span>
          </Link>

          {/* Welcome icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-4 ring-indigo-500/10 animate-in zoom-in duration-500">
            <Sparkles className="h-8 w-8 text-indigo-500" />
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-xl font-bold text-foreground">
              Welcome, {displayName}! 🎉
            </h1>
            <p className="text-sm text-muted-foreground">
              One last step — create a password so you can also sign in with email.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 px-4 py-3">
            <Shield className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Secure your account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adding a password lets you sign in with email + password as an alternative to Google.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email display (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="rounded-lg h-10 bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Create Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-lg h-10"
                autoFocus
              />

              {/* Strength bar + checklist */}
              {password.length > 0 && (
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
                    <span
                      className={`font-semibold ${
                        passwordStrength <= 2
                          ? "text-red-500"
                          : passwordStrength === 3
                          ? "text-yellow-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {strengthLabel}
                    </span>
                  </p>
                  {passwordStrength < 5 && (
                    <div className="grid grid-cols-1 gap-1 pt-1">
                      {passwordChecks.map((rule) => (
                        <div key={rule.id} className="flex items-center gap-2">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                              rule.passed ? "bg-emerald-500" : "bg-border"
                            }`}
                          >
                            {rule.passed ? (
                              <Check className="h-2.5 w-2.5 text-white" />
                            ) : (
                              <X className="h-2.5 w-2.5 text-muted-foreground" />
                            )}
                          </div>
                          <span
                            className={`text-xs transition-colors ${
                              rule.passed
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            }`}
                          >
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
              <Label htmlFor="confirm-new-password">Confirm Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`rounded-lg h-10 transition-colors ${
                  confirmPassword.length > 0
                    ? password === confirmPassword
                      ? "border-emerald-500 focus-visible:ring-emerald-500"
                      : "border-red-400 focus-visible:ring-red-400"
                    : ""
                }`}
              />
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  {password === confirmPassword ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Passwords match
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">
                        Passwords don't match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full rounded-full gap-2 h-11 text-sm font-semibold"
              disabled={saving}
            >
              {saving ? (
                "Setting up..."
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Skip option */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Skip for now — I'll set a password later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

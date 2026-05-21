import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, RotateCcw, Check, X } from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";

// Password policy matching Supabase's requirements
const PASSWORD_RULES = [
  { id: "length",    label: "At least 8 characters",   test: (p: string) => p.length >= 8 },
  { id: "lower",     label: "One lowercase letter",     test: (p: string) => /[a-z]/.test(p) },
  { id: "upper",     label: "One uppercase letter",     test: (p: string) => /[A-Z]/.test(p) },
  { id: "number",    label: "One number",               test: (p: string) => /[0-9]/.test(p) },
  { id: "special",   label: "One special character",    test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useAuthRedirect();

  const passwordChecks = useMemo(() => PASSWORD_RULES.map(r => ({ ...r, passed: r.test(password) })), [password]);
  const passwordStrength = passwordChecks.filter(r => r.passed).length; // 0-5
  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][passwordStrength];
  const strengthColor = ["bg-border", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-400", "bg-emerald-500"][passwordStrength];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const failedRules = passwordChecks.filter(r => !r.passed);
    if (failedRules.length > 0) {
      toast({ title: "Password doesn't meet requirements", description: failedRules.map(r => r.label).join(", "), variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      // Supabase's Email Enumeration Protection returns an empty identities array if the email exists
      const emailExists = data?.user && data.user.identities && data.user.identities.length === 0;

      if (error || emailExists) {
        setLoading(false);

        if (error?.message === "Failed to fetch") {
          toast({
            title: "Network error",
            description: "Could not reach the server. Check your connection.",
            variant: "destructive",
          });
          return;
        }

        // If the email already exists, try signing them in automatically
        if (emailExists) {
          try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (!loginError) {
              // Login succeeded — redirect to dashboard with a friendly message
              sessionStorage.setItem("show_welcome_back", "true");
              toast({
                title: "Welcome back! 👋",
                description: "An account with this email already exists. We've signed you in.",
              });
              navigate("/dashboard", { replace: true });
              return;
            }
          } catch {
            // Login attempt failed silently — fall through to redirect
          }

          // Password didn't match — redirect to login page with email pre-filled
          toast({
            title: "Account already exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          navigate(`/login?email=${encodeURIComponent(email)}`, { replace: true });
          return;
        }

        // Generic error
        toast({
          title: "Signup failed",
          description: error?.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } else if (data?.session) {
        toast({ title: "Account created!", description: "Welcome to Connectly." });
        // Redirection handled by AuthProvider
      } else {
        setLoading(false);
        setSuccess(true);
      }
    } catch (err) {
      setLoading(false);
      const error = err as Error;
      const errorMessage = error.message || "An unexpected network error occurred.";
      toast({ 
        title: "Signup failed", 
        description: errorMessage === "Failed to fetch" 
          ? "Connection refused: Ensure your Supabase settings are correct." 
          : errorMessage, 
        variant: "destructive" 
      });
      console.error("Signup exception:", error);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);

    // Clear any existing session tokens to prevent accidental Google account linking
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => sessionStorage.removeItem(k));

    sessionStorage.setItem("oauth_flow_source", "signup");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/complete-profile`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setLoading(false);
      console.error("Google Auth error:", error);
      toast({ title: "Google signup failed", description: error.message, variant: "destructive" });
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/verify-email` },
      });
      if (error) {
        toast({ title: "Couldn't resend", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Email resent!", description: `A new link was sent to ${email}` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to resend. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-border bg-card p-10 shadow-lg">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <ConnectlyLogoIcon size={28} />
            Connect<span className="text-primary">ly</span>
          </Link>

          {/* Animated envelope icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20 animate-in zoom-in duration-500">
            <Mail className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-xl font-bold text-foreground">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              We sent a verification link to{" "}
              <strong className="text-foreground">{email}</strong>.
              Click it to activate your account.
            </p>
          </div>

          <div className="rounded-xl bg-muted/60 border border-border px-4 py-3 text-left space-y-1">
            <p className="text-xs font-semibold text-foreground">Didn't get the email?</p>
            <p className="text-xs text-muted-foreground">Check your spam folder, or click below to resend.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full rounded-full gap-2"
              onClick={handleResendEmail}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4" />
              {loading ? "Resending…" : "Resend verification email"}
            </Button>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <ConnectlyLogoIcon size={28} />
            Connect<span className="text-primary">ly</span>
          </Link>
          <h1 className="font-display text-xl font-semibold text-foreground mt-4">Create your account</h1>
          <p className="text-muted-foreground text-sm">Start organizing your professional network today.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full rounded-full gap-2" 
            onClick={handleGoogleSignup} 
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium tracking-wider">
                Or
              </span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-lg" />

              {/* Strength bar + checklist */}
              {password.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor : "bg-border"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength: <span className={`font-semibold ${passwordStrength <= 2 ? "text-red-500" : passwordStrength === 3 ? "text-yellow-500" : "text-emerald-500"}`}>{strengthLabel}</span>
                  </p>
                  {/* Hide checklist when all rules pass (Very Strong) */}
                  {passwordStrength < 5 && (
                    <div className="grid grid-cols-1 gap-1 pt-1">
                      {passwordChecks.map(rule => (
                        <div key={rule.id} className="flex items-center gap-2">
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${rule.passed ? "bg-emerald-500" : "bg-border"}`}>
                            {rule.passed ? <Check className="h-2.5 w-2.5 text-white" /> : <X className="h-2.5 w-2.5 text-muted-foreground" />}
                          </div>
                          <span className={`text-xs transition-colors ${rule.passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`rounded-lg transition-colors ${
                  confirmPassword.length > 0
                    ? password === confirmPassword
                      ? "border-emerald-500 focus-visible:ring-emerald-500"
                      : "border-red-400 focus-visible:ring-red-400"
                    : ""
                }`}
              />
              {/* Real-time match indicator */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  {password === confirmPassword ? (
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
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up with Email"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

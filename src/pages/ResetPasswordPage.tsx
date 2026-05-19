import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, KeyRound } from "lucide-react";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character (e.g. !@#$%)");

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "invalid">("loading");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    let isReady = false;

    // Listen for the PASSWORD_RECOVERY event which fires after Supabase
    // processes the recovery token from the URL hash and establishes a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        isReady = true;
        setStatus("ready");
      }
    });

    // Also check if we already have a session (e.g. page reload after token was processed)
    const checkSession = async () => {
      if (isReady) return;

      const { data: { session } } = await supabase.auth.getSession();
      const hash = window.location.hash;
      if (session && (hash.includes("type=recovery") || hash.includes("access_token"))) {
        isReady = true;
        setStatus("ready");
      } else if (!hash.includes("type=recovery") && !hash.includes("access_token")) {
        // No recovery token at all — invalid link
        setStatus("invalid");
      }
      // If hash has token but no session yet, keep loading — onAuthStateChange will fire
    };

    // Small delay to let Supabase client process the hash
    const timeout = setTimeout(checkSession, 1000);

    // Fallback: if nothing happens after 5s, mark invalid
    const fallback = setTimeout(() => {
      if (!isReady) {
        setStatus("invalid");
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
      clearTimeout(fallback);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setPasswordErrors(result.error.errors.map((err) => err.message));
      return;
    }
    setPasswordErrors([]);
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match", variant: "destructive" });
      return;
    }

    // Verify session exists before updating
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Session expired", description: "Please log in again to change your password.", variant: "destructive" });
      navigate("/login");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("session")) {
        toast({ title: "Session expired", description: "Please log in again and retry.", variant: "destructive" });
        navigate("/login");
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      // Force sign out of the temporary recovery session so they must log in with their new password
      await supabase.auth.signOut();
      setLoading(false);
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/login");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 relative">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
        <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-border/80 bg-card p-8 shadow-xl">
          <h2 className="font-display text-xl font-bold text-foreground">Invalid or expired link</h2>
          <p className="text-muted-foreground text-sm">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-primary hover:underline text-sm font-semibold">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      
      <Link to="/login" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <ConnectlyLogoIcon size={28} />
            Connect<span className="text-primary">ly</span>
          </Link>
          <div className="mx-auto mt-6 inline-flex rounded-full bg-primary/10 p-3 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-semibold text-foreground mt-2">Set new password</h1>
          <p className="text-muted-foreground text-sm">Enter your new secure password below to update your account.</p>
        </div>

        <form onSubmit={handleReset} className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-8 shadow-xl space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => { 
                setPassword(e.target.value); 
                if (passwordErrors.length) { 
                  const r = passwordSchema.safeParse(e.target.value); 
                  setPasswordErrors(r.success ? [] : r.error.errors.map(err => err.message)); 
                } 
              }} 
              required 
              className="rounded-lg bg-background/50 border-border/60 focus:border-primary/80 transition-colors" 
            />
            {passwordErrors.length > 0 && (
              <ul className="text-xs text-destructive space-y-0.5 mt-1 bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                {passwordErrors.map((err) => <li key={err}>• {err}</li>)}
              </ul>
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
              className="rounded-lg bg-background/50 border-border/60 focus:border-primary/80 transition-colors" 
            />
          </div>
          <Button type="submit" className="w-full rounded-full font-medium" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

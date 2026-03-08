import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Zap, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if user has 2FA enabled before signing in
    try {
      const res = await supabase.functions.invoke("totp-manage", {
        body: { action: "check-2fa", email },
      });

      if (res.data?.enabled) {
        // Sign in to validate credentials first
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({ title: "Login failed", description: error.message, variant: "destructive" });
          setLoading(false);
          return;
        }
        // Sign out immediately - need 2FA verification first
        await supabase.auth.signOut();
        setShow2FA(true);
        setLoading(false);
        return;
      }
    } catch {
      // If check fails, proceed with normal login
    }

    // Normal login (no 2FA)
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handle2FAVerify = async () => {
    if (twoFACode.length !== 6) return;
    setVerifying2FA(true);

    try {
      const res = await supabase.functions.invoke("totp-manage", {
        body: { action: "login-verify", email, code: twoFACode },
      });

      if (res.data?.valid) {
        // Code verified, sign in again
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({ title: "Login failed", description: error.message, variant: "destructive" });
        } else {
          if (res.data?.recovery_used) {
            toast({ title: "Recovery code used", description: "Consider generating new recovery codes in Account Settings." });
          }
          navigate("/dashboard");
        }
      } else {
        toast({ title: "Invalid code", description: "Please try again.", variant: "destructive" });
        setTwoFACode("");
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
      setTwoFACode("");
    } finally {
      setVerifying2FA(false);
    }
  };

  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
        <button
          onClick={() => { setShow2FA(false); setTwoFACode(""); }}
          className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-xl font-semibold text-foreground">Two-Factor Authentication</h1>
            <p className="text-muted-foreground text-sm">Enter the 6-digit code from your authenticator app.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={twoFACode} onChange={setTwoFACode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handle2FAVerify}
              className="w-full rounded-full"
              disabled={twoFACode.length !== 6 || verifying2FA}
            >
              {verifying2FA ? "Verifying..." : "Verify"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can also enter a recovery code if you've lost access to your authenticator app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <Zap className="h-7 w-7 text-primary" />
            Connect<span className="text-primary">ly</span>
          </Link>
          <h1 className="font-display text-xl font-semibold text-foreground mt-4">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Log in to manage your professional relationships.</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-lg" />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">Create account</Link>
        </p>
      </div>
    </div>
  );
}

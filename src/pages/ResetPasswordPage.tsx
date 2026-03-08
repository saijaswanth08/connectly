import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Must contain at least one letter")
  .regex(/[0-9]/, "Must contain at least one number");

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    }
  }, []);

  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

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
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/login");
    }
  };

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="font-display text-xl font-bold text-foreground">Invalid or expired link</h2>
          <p className="text-muted-foreground text-sm">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-primary hover:underline text-sm font-medium">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <Link to="/login" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <ConnectlyLogoIcon size={28} />
            Connect<span className="text-primary">ly</span>
          </Link>
          <h1 className="font-display text-xl font-semibold text-foreground mt-4">Set new password</h1>
          <p className="text-muted-foreground text-sm">Enter your new password below.</p>
        </div>

        <form onSubmit={handleReset} className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="rounded-lg" />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Zap, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <Link to="/login" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <Zap className="h-7 w-7 text-primary" />
            Connect<span className="text-primary">ly</span>
          </Link>
          <h1 className="font-display text-xl font-semibold text-foreground mt-4">Reset your password</h1>
          <p className="text-muted-foreground text-sm">Enter your email address and we'll send you a password reset link.</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
            <div className="mx-auto inline-flex rounded-full bg-accent p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">Check your email</h2>
            <p className="text-muted-foreground text-sm">We've sent a password reset link to <strong>{email}</strong>.</p>
            <Link to="/login" className="text-primary hover:underline text-sm font-medium">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg" />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

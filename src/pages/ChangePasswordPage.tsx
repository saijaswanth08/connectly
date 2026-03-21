import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, Lock } from "lucide-react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Must contain at least one letter")
  .regex(/[0-9]/, "Must contain at least one number");

type Step = "form" | "sent";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const email = user?.email || "";

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (value: string) => {
    const result = passwordSchema.safeParse(value);
    if (!result.success) {
      setPasswordErrors(result.error.errors.map((e) => e.message));
      return false;
    }
    setPasswordErrors([]);
    return true;
  };

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(newPassword)) return;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!email) {
      toast.error("No email address found for your account.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setStep("sent");
      toast.success("Verification email sent! Check your inbox.");
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

        {step === "form" && (
          <Card className="rounded-2xl shadow-sm border-border">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-xl font-bold text-foreground">
                Change Password
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Enter your new password. We'll send a verification email before updating it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestChange} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={email} disabled className="pl-10 rounded-lg bg-muted/50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                  <Input
                    id="newPassword"
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
                      {passwordErrors.map((err) => (
                        <li key={err}>• {err}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full rounded-full">
                  {loading ? "Sending..." : "Request Password Change"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "sent" && (
          <Card className="rounded-2xl shadow-sm border-border">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-xl font-bold text-foreground">
                Verification Required
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm max-w-xs mx-auto">
                We've sent a verification link to <strong className="text-foreground">{email}</strong>. Please verify your email to complete the password change.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">What happens next?</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open the verification email in your inbox</li>
                  <li>Click the secure link to confirm</li>
                  <li>Set your new password on the confirmation page</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  The link expires in 10 minutes. Check spam if you don't see it.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                className="w-full rounded-full"
              >
                Resend Verification Email
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="w-full rounded-full text-muted-foreground"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

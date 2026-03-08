import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

type Step = "request" | "sent" | "update" | "success";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const email = user?.email || "";

  const [step, setStep] = useState<Step>("request");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleSendVerification = async () => {
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

  const validatePassword = (value: string) => {
    const result = passwordSchema.safeParse(value);
    if (!result.success) {
      setPasswordErrors(result.error.errors.map((e) => e.message));
      return false;
    }
    setPasswordErrors([]);
    return true;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(newPassword)) return;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setStep("success");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {/* Step: Request verification */}
        {step === "request" && (
          <Card className="rounded-2xl shadow-sm border-border">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-xl font-bold text-foreground">
                Change Password
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                For security, we'll verify your email before allowing a password change.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="pl-10 rounded-lg bg-muted/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A verification link will be sent to this email.
                </p>
              </div>
              <Button
                onClick={handleSendVerification}
                disabled={loading}
                className="w-full rounded-full"
              >
                {loading ? "Sending..." : "Send Verification Email"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Email sent */}
        {step === "sent" && (
          <Card className="rounded-2xl shadow-sm border-border">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-xl font-bold text-foreground">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm max-w-xs mx-auto">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>. Click the link in the email to set your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Didn't receive it?</strong>
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Check your spam or junk folder</li>
                  <li>The link expires in 10 minutes</li>
                  <li>Make sure your email address is correct</li>
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={() => setStep("request")}
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

        {/* Step: Success */}
        {step === "success" && (
          <Card className="rounded-2xl shadow-sm border-border">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-xl font-bold text-foreground">
                Password Updated Successfully
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Your Connectly account password has been changed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full rounded-full"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

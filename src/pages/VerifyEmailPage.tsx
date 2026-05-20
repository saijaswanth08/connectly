import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setError("Invalid verification link. Missing token or email.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });

        const data = await response.json();

        if (data.success) {
          setVerified(true);
          toast({ title: "Email verified!", description: "Your account is now active." });
        } else {
          setError(data.error || "Verification failed. Please try again.");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Network error";
        setError(`Verification failed: ${errorMessage}`);
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, email, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">Verifying your email...</h2>
          <p className="text-muted-foreground text-sm">Please wait while we confirm your email address.</p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
        <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
          <h2 className="font-display text-xl font-bold text-foreground">Email Verified!</h2>
          <p className="text-muted-foreground text-sm">
            Your email address has been successfully verified. Your account is now fully active.
          </p>
          <div className="pt-4">
            <Button className="w-full rounded-full" asChild>
              <Link to="/login">Sign In to Your Account</Link>
            </Button>
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
      <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <h2 className="font-display text-xl font-bold text-foreground">Verification Failed</h2>
        <p className="text-muted-foreground text-sm">
          {error || "We couldn't verify your email address. The link may have expired."}
        </p>
        <div className="pt-4 space-y-2">
          <Button className="w-full rounded-full" asChild>
            <Link to="/signup">Request New Verification Email</Link>
          </Button>
          <Button variant="outline" className="w-full rounded-full" asChild>
            <Link to="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      try {
        // Supabase puts the token in the URL hash: #access_token=...&refresh_token=...&type=signup
        const hash = window.location.hash;

        if (!hash) {
          if (isMounted) {
            setState("error");
            setErrorMessage("No verification token found. This link may be invalid or already used.");
          }
          return;
        }

        // Parse the hash params
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        // Only handle signup/email_change confirmation tokens
        if (!accessToken || !refreshToken) {
          if (isMounted) {
            setState("error");
            setErrorMessage("Invalid verification link. Please request a new one.");
          }
          return;
        }

        // Supabase's detectSessionInUrl should handle this automatically,
        // but we also call setSession explicitly to ensure the session is set
        // and to give us a clear success/error signal.
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!isMounted) return;

        if (error) {
          setState("error");
          setErrorMessage(
            error.message.includes("expired")
              ? "This verification link has expired. Please request a new one."
              : error.message
          );
        } else {
          setState("success");
          // If this was a signup confirmation, the type will be "signup"
          // For email change confirmations type will be "email_change"
          console.log("[VerifyEmail] Verified successfully, type:", type);
        }
      } catch (err) {
        if (!isMounted) return;
        setState("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
        console.error("[VerifyEmail] Exception:", err);
      }
    };

    verifyEmail();
    return () => { isMounted = false; };
  }, []);

  // Countdown and auto-redirect after success
  useEffect(() => {
    if (state !== "success") return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/dashboard", { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, navigate]);

  const handleResend = async () => {
    // We can't resend without knowing the original email.
    // Navigate to login with a message, or to signup.
    toast({
      title: "Request a new link",
      description: "Please sign in — if your email isn't confirmed yet, we'll prompt you to resend.",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-border bg-card p-10 shadow-lg">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground">
          <ConnectlyLogoIcon size={28} />
          Connect<span className="text-primary">ly</span>
        </Link>

        {/* --- LOADING --- */}
        {state === "loading" && (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Verifying your email…</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your account.
            </p>
          </div>
        )}

        {/* --- SUCCESS --- */}
        {state === "success" && (
          <div className="space-y-4 py-4">
            {/* Animated checkmark ring */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/20 animate-in zoom-in duration-500">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-xl font-bold text-foreground">Email verified! 🎉</h1>
              <p className="text-sm text-muted-foreground">
                Your account is now active. Welcome to Connectly!
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                Redirecting to your dashboard in{" "}
                <span className="font-bold tabular-nums">{countdown}</span>s…
              </p>
            </div>
            <Button
              className="w-full rounded-full"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Go to Dashboard now
            </Button>
          </div>
        )}

        {/* --- ERROR --- */}
        {state === "error" && (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-xl font-bold text-foreground">Verification failed</h1>
              <p className="text-sm text-muted-foreground">
                {errorMessage || "Something went wrong with the verification link."}
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-1">
              <Button
                className="w-full rounded-full gap-2"
                onClick={handleResend}
                disabled={resending}
              >
                <Mail className="h-4 w-4" />
                {resending ? "Sending…" : "Request a new verification link"}
              </Button>
              <Link
                to="/signup"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

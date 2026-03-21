import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export default function VerifyPasswordUpdatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "updating" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const updateAttempted = useRef(false);

  useEffect(() => {
    if (updateAttempted.current) return;
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing verification token.");
      return;
    }

    const verifyAndUpdate = async () => {
      updateAttempted.current = true;
      try {
        // 1. Verify token with backend
        const res = await fetch(`${BACKEND_URL}/api/password-update/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error || "Verification failed.");
        }

        const { newPassword } = result.data;

        // 2. Perform the actual password update via Supabase
        setStatus("updating");
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) throw updateError;

        // 3. Success
        setStatus("success");
        toast({
          title: "Password updated successfully",
          description: "Password updated successfully. You can now log in with your new password.",
        });
      } catch (err: unknown) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
        setErrorMessage(msg);
      }
    };

    verifyAndUpdate();
  }, [token, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md bg-card border border-border/60 shadow-xl rounded-2xl p-8 text-center space-y-6">
        
        {/* Icon based on status */}
        <div className="flex justify-center">
          {status === "verifying" || status === "updating" ? (
            <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          ) : status === "success" ? (
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          )}
        </div>

        {/* Content based on status */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {status === "verifying" && "Verifying Request..."}
            {status === "updating" && "Finalizing Update..."}
            {status === "success" && "Password Updated!"}
            {status === "error" && "Verification Failed"}
          </h1>
          <p className="text-muted-foreground">
            {status === "verifying" && "Checking your verification token..."}
            {status === "updating" && "Applying your new secure password..."}
            {status === "success" && "Password updated successfully. You can now log in with your new password."}
            {status === "error" && (errorMessage || "The verification link is invalid or has expired.")}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {status === "success" ? (
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          ) : status === "error" ? (
            <Button className="w-full" variant="outline" onClick={() => navigate("/dashboard/settings")}>
              Back to Security Settings
            </Button>
          ) : null}
        </div>

        {/* Safe Badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-4 uppercase tracking-widest font-semibold opacity-60">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure Verification Flow
        </div>
      </div>
    </div>
  );
}

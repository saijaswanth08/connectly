import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Shield, ShieldCheck, ShieldOff, Copy, Download, Loader2, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function TwoFactorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [step, setStep] = useState<"qr" | "verify" | "recovery">("qr");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [secretDisplay, setSecretDisplay] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: twoFaStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["2fa-status", user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("totp-manage", {
        body: { action: "status" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      return res.data as { enabled: boolean; created_at?: string };
    },
    enabled: !!user?.id,
  });

  const isEnabled = twoFaStatus?.enabled ?? false;

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("totp-manage", {
        body: { action: "setup" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || "Setup failed");
      setOtpauthUrl(res.data.otpauth_url);
      setSecretDisplay(res.data.secret_display);
      setStep("qr");
      setVerifyCode("");
      setSetupOpen(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("totp-manage", {
        body: { action: "verify-setup", code: verifyCode },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || "Verification failed");
      setRecoveryCodes(res.data.recovery_codes);
      setStep("recovery");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    } catch (err: any) {
      toast({ title: "Invalid code", description: err.message, variant: "destructive" });
      setVerifyCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("totp-manage", {
        body: { action: "disable", code: disableCode },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || "Failed to disable");
      toast({ title: "2FA disabled successfully" });
      setDisableOpen(false);
      setDisableCode("");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setDisableCode("");
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    toast({ title: "Recovery codes copied!" });
  };

  const downloadRecoveryCodes = () => {
    const blob = new Blob([`Connectly Recovery Codes\n${"=".repeat(30)}\n\n${recoveryCodes.join("\n")}\n\nKeep these codes safe. Each code can only be used once.`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "connectly-recovery-codes.txt";
    a.click();
  };

  return (
    <>
      {/* Settings Card */}
      <div className="rounded-xl bg-card border border-border/50 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold">Two-Factor Authentication</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security to your account using an authenticator app.
        </p>

        {statusLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking status...
          </div>
        ) : isEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">2FA is enabled</span>
            </div>
            <Button variant="outline" className="gap-2 text-destructive" onClick={() => { setDisableCode(""); setDisableOpen(true); }}>
              <ShieldOff className="h-4 w-4" /> Disable 2FA
            </Button>
          </div>
        ) : (
          <Button className="gap-2" onClick={handleStartSetup} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Enable 2FA
          </Button>
        )}
      </div>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={(open) => { if (!open && step !== "recovery") setSetupOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {step === "qr" && "Enable Two-Factor Authentication"}
              {step === "verify" && "Verify Setup"}
              {step === "recovery" && "Save Recovery Codes"}
            </DialogTitle>
            <DialogDescription>
              {step === "qr" && "Scan this QR code with your authenticator app."}
              {step === "verify" && "Enter the 6-digit code from your authenticator app."}
              {step === "recovery" && "Save these codes in a safe place. They can be used to access your account if you lose your device."}
            </DialogDescription>
          </DialogHeader>

          {step === "qr" && (
            <div className="space-y-4">
              <div className="flex justify-center py-4">
                <div className="rounded-xl border border-border p-4 bg-white">
                  <QRCodeSVG value={otpauthUrl} size={200} level="H" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Manual setup key:</p>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <code className="text-sm font-mono flex-1 select-all">{secretDisplay}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(secretDisplay.replace(/-/g, "")); toast({ title: "Key copied!" }); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Compatible with Google Authenticator, Microsoft Authenticator, Authy, and other TOTP apps.
              </p>
              <DialogFooter>
                <Button onClick={() => setStep("verify")} className="w-full">Continue</Button>
              </DialogFooter>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div className="flex justify-center py-4">
                <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
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
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep("qr")}>Back</Button>
                <Button onClick={handleVerifySetup} disabled={verifyCode.length !== 6 || loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Verify & Enable
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "recovery" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code) => (
                    <code key={code} className="text-sm font-mono text-center py-1 px-2 rounded bg-background border border-border">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={copyRecoveryCodes}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={downloadRecoveryCodes}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
              <p className="text-xs text-destructive font-medium">
                ⚠️ These codes will not be shown again. Save them now.
              </p>
              <DialogFooter>
                <Button onClick={() => { setSetupOpen(false); setStep("qr"); }} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation */}
      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your 2FA code to confirm disabling two-factor authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={disableCode} onChange={setDisableCode}>
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={disableCode.length !== 6 || loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

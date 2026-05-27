import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { lookupProfileByEmail } from "@/lib/contactRequestsApi";
import { useSendContactRequest } from "@/hooks/useContactRequests";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AddContactDialogProps {
  open?: boolean;
  onClose?: () => void;
}

type CheckState = 'idle' | 'checking' | 'found' | 'not_found' | 'is_self';

export function AddContactDialog({ open: controlledOpen, onClose }: AddContactDialogProps = {}) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? controlledOpen : internalOpen;

  const [email, setEmail] = useState('');
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [foundProfile, setFoundProfile] = useState<{ id: string; name: string; email: string; company: string; job_title: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const sendRequest = useSendContactRequest();

  useEffect(() => {
    if (!dialogOpen) {
      setEmail('');
      setCheckState('idle');
      setFoundProfile(null);
    }
  }, [dialogOpen]);

  function handleOpenChange(val: boolean) {
    if (isControlled) { if (!val) onClose?.(); }
    else setInternalOpen(val);
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setEmail(val);
    setCheckState('idle');
    setFoundProfile(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.includes('@')) return;

    debounceRef.current = setTimeout(async () => {
      setCheckState('checking');
      try {
        const profile = await lookupProfileByEmail(val);
        if (profile && profile.id !== user?.id) {
          setFoundProfile(profile);
          setCheckState('found');
        } else if (profile && profile.id === user?.id) {
          setCheckState('is_self'); // Can't add yourself
        } else {
          setCheckState('not_found');
        }
      } catch {
        setCheckState('idle');
      }
    }, 600);
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!foundProfile || !user) return;
    setSubmitting(true);
    try {
      await sendRequest.mutateAsync(foundProfile.id);
      toast({
        title: "Contact request sent!",
        description: `${foundProfile.name} will be notified in-app.`,
        className: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
      });
      handleOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send request.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Contact</DialogTitle>
          <DialogDescription>
            Enter the email address of a Connectly user to send them a contact request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendRequest} className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="ac-email">Email Address *</Label>
            <Input
              id="ac-email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="colleague@example.com"
              autoFocus
            />

            {/* Status indicator */}
            <div className="min-h-[40px] pt-1">
              {checkState === 'checking' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking Connectly...
                </div>
              )}

              {checkState === 'found' && foundProfile && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{foundProfile.name} is on Connectly!</p>
                    {foundProfile.job_title && foundProfile.company && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">{foundProfile.job_title} at {foundProfile.company}</p>
                    )}
                  </div>
                </div>
              )}

              {checkState === 'is_self' && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 animate-in fade-in duration-200">
                  <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">This is you!</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      This is your own email address. You cannot add yourself as a contact.
                    </p>
                  </div>
                </div>
              )}

              {checkState === 'not_found' && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 animate-in fade-in duration-200">
                  <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Not on Connectly</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      This email isn't registered. Share your profile link to invite them.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={checkState !== 'found' || submitting} className="gap-2">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><UserPlus className="h-4 w-4" /> Send Request</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

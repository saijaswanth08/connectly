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
import { supabase } from "@/lib/supabase";

interface AddContactDialogProps {
  open?: boolean;
  onClose?: () => void;
}

type CheckState = 'idle' | 'checking' | 'found' | 'not_found' | 'is_self' | 'already_connected' | 'request_pending' | 'one_way_contact' | 'has_me_saved';

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
        if (profile && user?.id && profile.id !== user.id) {
          // 1. Check if a connection request already exists between these users
          const { data: outgoingReq } = await supabase
            .from('contact_requests')
            .select('status')
            .eq('from_user_id', user.id)
            .eq('to_user_id', profile.id)
            .maybeSingle();

          const { data: incomingReq } = await supabase
            .from('contact_requests')
            .select('status')
            .eq('from_user_id', profile.id)
            .eq('to_user_id', user.id)
            .maybeSingle();

          const existingRequest = outgoingReq || incomingReq;

          if (existingRequest?.status === 'accepted') {
            setFoundProfile(profile);
            setCheckState('already_connected');
          } else if (existingRequest?.status === 'pending') {
            setFoundProfile(profile);
            setCheckState('request_pending');
          } else {
            // 2. Check if this profile already has the current logged-in user saved in their contacts
            const { data: hasMeSaved } = await supabase
              .from('contacts')
              .select('id')
              .eq('user_id', profile.id)
              .eq('target_user_id', user.id)
              .limit(1)
              .maybeSingle();

            setFoundProfile(profile);

            if (hasMeSaved) {
              setCheckState('has_me_saved');
            } else {
              // 3. Check if User B is in User A's contacts list (one-way connection check)
              const { data: existingContact } = await supabase
                .from('contacts')
                .select('id')
                .eq('user_id', user.id)
                .or(`target_user_id.eq.${profile.id},email.eq.${profile.email}`)
                .limit(1);

              if (existingContact && existingContact.length > 0) {
                setCheckState('one_way_contact');
              } else {
                setCheckState('found');
              }
            }
          }
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
      if (checkState === 'has_me_saved') {
        // Direct/instant connection path: Insert contact record directly on current user's side
        const { error } = await supabase.from('contacts').insert({
          user_id: user.id,
          name: foundProfile.name,
          email: foundProfile.email,
          target_user_id: foundProfile.id,
          priority: 'medium',
          company: foundProfile.company || '',
          job_title: foundProfile.job_title || '',
          notes: 'Connected instantly via reciprocal save',
          tags: [],
        });

        if (error) throw error;

        toast({
          title: "Contact added instantly! 🎉",
          description: `${foundProfile.name} was successfully added to your contacts list.`,
          className: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
        });
      } else {
        // Standard pending request path
        await sendRequest.mutateAsync(foundProfile.id);
        toast({
          title: "Contact request sent!",
          description: `${foundProfile.name} will be notified in-app.`,
          className: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
        });
      }
      handleOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process request.";
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

              {checkState === 'already_connected' && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3 animate-in fade-in duration-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Already connected</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      You are already fully connected with this user on Connectly.
                    </p>
                  </div>
                </div>
              )}

              {checkState === 'request_pending' && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 animate-in fade-in duration-200">
                  <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Request Pending</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      A contact request is already pending between you two. Please check your notifications!
                    </p>
                  </div>
                </div>
              )}

              {checkState === 'one_way_contact' && foundProfile && (
                <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 dark:border-primary/80 p-3 animate-in fade-in duration-200">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Saved in contacts (one-way)</p>
                    <p className="text-xs text-muted-foreground">
                      {foundProfile.name} is in your contacts list, but you aren't connected on Connectly. Send a request to connect both ways!
                    </p>
                  </div>
                </div>
              )}

              {checkState === 'has_me_saved' && foundProfile && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3 animate-in fade-in duration-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Instant connection available! 🎉</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {foundProfile.name} already has you saved in their contacts. You can connect with them instantly without sending a request!
                    </p>
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
            <Button 
              type="submit" 
              disabled={!(checkState === 'found' || checkState === 'one_way_contact' || checkState === 'has_me_saved') || submitting} 
              className="gap-2"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              ) : checkState === 'has_me_saved' ? (
                <><CheckCircle2 className="h-4 w-4" /> Add Instantly</>
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

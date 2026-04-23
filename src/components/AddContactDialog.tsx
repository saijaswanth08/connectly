import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContact } from "@/hooks/useContacts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";



const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  job_title: "",
  linkedin: "",
  instagram: "",
  priority: "medium",

  notes: "",
};

interface AddContactDialogProps {
  /** Controlled mode: pass open + onClose to drive the dialog from outside */
  open?: boolean;
  onClose?: () => void;
}

export function AddContactDialog({ open: controlledOpen, onClose }: AddContactDialogProps = {}) {
  const isControlled = controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? controlledOpen : internalOpen;

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const createContact = useCreateContact();

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setForm(emptyForm);
      setErrors({});
    }
  }, [dialogOpen]);

  function handleOpenChange(val: boolean) {
    if (isControlled) {
      if (!val) onClose?.();
    } else {
      setInternalOpen(val);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!form.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "You must be logged in to add contacts.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await createContact.mutateAsync({
        user_id: user.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        job_title: form.job_title.trim(),
        priority: form.priority,

        linkedin: form.linkedin.trim(),
        instagram: form.instagram.trim(),
        notes: form.notes.trim(),
      });

      toast({
        title: "Contact added successfully",
        description: `${form.name} has been saved.`,
        className: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
      });
      handleOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? "Failed to save contact. Please try again.";
      console.error("[AddContactDialog] createContact error:", err);
      toast({ title: "Error adding contact", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Two-column grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ac-name" className={errors.name ? "text-destructive" : ""}>
                Full Name *
              </Label>
              <Input
                id="ac-name"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); if (errors.name) setErrors({}); }}
                placeholder="Your full name"
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}
              />
              {errors.name && <p className="text-[11px] font-medium text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ac-email">Email Address</Label>
              <Input
                id="ac-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ac-company">Company</Label>
              <Input
                id="ac-company"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Company name"
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ac-jobTitle">Job Title</Label>
              <Input
                id="ac-jobTitle"
                value={form.job_title}
                onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                placeholder="Your role"
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ac-phone">Phone Number</Label>
              <Input
                id="ac-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXXXXXXX"
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger className="focus-visible:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ac-linkedin">LinkedIn URL</Label>
              <Input
                id="ac-linkedin"
                value={form.linkedin}
                onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                placeholder="linkedin.com/in/username"
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ac-instagram">Instagram</Label>
              <Input
                id="ac-instagram"
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                placeholder="@your_handle"
                className="focus-visible:ring-primary"
              />
            </div>
          </div>



          {/* Notes — full width */}
          <div className="space-y-1.5">
            <Label htmlFor="ac-notes">Notes</Label>
            <Textarea
              id="ac-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="How did you meet? Key discussion points..."
              rows={3}
              className="focus-visible:ring-primary"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ContactTag, ImportanceLevel } from "@/lib/types";
import { useCreateContact } from "@/hooks/useContacts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const allTags: ContactTag[] = ["investor", "client", "mentor", "partner", "recruiter", "friend"];

const emptyForm = {
  name: "", email: "", phone: "", company: "", jobTitle: "",
  importance: "medium" as ImportanceLevel, tags: [] as ContactTag[], notes: "",
};

export function AddContactDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const createContact = useCreateContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!form.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    setSubmitting(true);
    try {
      // Always fetch the freshest session — avoids stale cached user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast({
          title: "Not signed in",
          description: "You must be logged in to add a contact.",
          variant: "destructive",
        });
        return;
      }

      await createContact.mutateAsync({
        user_id: user.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        job_title: form.jobTitle.trim(),
        linkedin_url: "",
        meeting_location: "",
        meeting_date: null,
        notes: form.notes.trim(),
        tags: form.tags,
        importance: form.importance,
      });

      toast({ 
        title: "Contact added successfully", 
        description: `${form.name} has been saved.`,
        className: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800" 
      });
      setForm(emptyForm);
      setOpen(false);
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

  const toggleTag = (tag: ContactTag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>Name *</Label>
              <Input 
                id="name" 
                value={form.name} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  if (errors.name) setErrors({});
                }} 
                placeholder="Full name" 
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}
              />
              {errors.name && <p className="text-[11px] font-medium text-destructive mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@company.com" className="focus-visible:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0100" className="focus-visible:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Company name" className="focus-visible:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input id="jobTitle" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="CEO, Founder..." className="focus-visible:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.importance} onValueChange={(v) => setForm((f) => ({ ...f, importance: v as ImportanceLevel }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    form.tags.includes(tag) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="How did you meet? Key discussion points..." rows={3} className="focus-visible:ring-primary" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>
              Add Contact
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

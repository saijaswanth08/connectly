import { useParams, Link, useNavigate } from "react-router-dom";
import { useContacts, useUpdateContact, useDeleteContact } from "@/hooks/useContacts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Building2, Mail, Phone, MapPin, Linkedin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContactReminders } from "@/components/ContactReminders";
import { ContactTimeline } from "@/components/ContactTimeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ContactDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: contacts = [], isLoading } = useContacts();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { toast } = useToast();
  const navigate = useNavigate();

  const contact = contacts.find((c) => c.id === id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-14 rounded-md" />
            <Skeleton className="h-9 w-10 rounded-md" />
          </div>
        </div>

        {/* Info Card Skeleton */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>
          <Skeleton className="h-3.5 w-28 rounded" />
        </div>

        {/* Follow-Up Reminders Skeleton */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>

        {/* Timeline Skeleton */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <Skeleton className="h-6 w-44 rounded" />
          <div className="space-y-4 pt-2">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3.5 w-full rounded" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4 rounded" />
                <Skeleton className="h-3.5 w-5/6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!contact) {
    return <div className="p-6 text-center text-muted-foreground">Contact not found. <Link to="/dashboard" className="text-primary">Go back</Link></div>;
  }

  const startEdit = () => {
    setForm({
      name: contact.name, company: contact.company, job_title: contact.job_title,
      email: contact.email, phone: contact.phone, linkedin: contact.linkedin,
      instagram: contact.instagram, notes: contact.notes,
      priority: contact.priority || "medium",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        updates: {
          name: form.name, company: form.company, job_title: form.job_title,
          email: form.email, phone: form.phone, linkedin: form.linkedin,
          instagram: form.instagram, notes: form.notes,
          priority: form.priority,
        },
      });
      setEditing(false);
      toast({ title: "Contact updated!" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contact.id);
      toast({ title: "Contact deleted" });
      navigate("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/5 rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {/* Large Premium Profile Photo / Avatar */}
        <Avatar key={contact.id} className="h-14 w-14 border-2 border-background shadow-md shrink-0">
          {contact.avatar_url && <AvatarImage src={contact.avatar_url} className="object-cover" />}
          <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
            {(contact.name || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight tracking-tight">{contact.name}</h1>
          {contact.priority && (
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              contact.priority === "vip" && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
              contact.priority === "high" && "bg-rose-500/10 text-rose-500 border border-rose-500/20",
              contact.priority === "medium" && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
              contact.priority === "low" && "bg-slate-500/10 text-slate-500 border border-slate-500/20"
            )}>
              {contact.priority} Priority
            </span>
          )}
        </div>

        {!editing && <Button variant="outline" size="sm" onClick={startEdit}>Edit</Button>}
        {!editing && <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>}
      </div>

      {editing ? (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Job Title</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
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
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} /></div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="rounded-full gap-2" disabled={updateContact.isPending}><Save className="h-4 w-4" />{updateContact.isPending ? "Saving..." : "Save"}</Button>
            <Button variant="outline" className="rounded-full" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {contact.company && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{contact.job_title ? `${contact.job_title} at ${contact.company}` : contact.company}</span>}
            {contact.email && <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{contact.email}</span>}
            {contact.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{contact.phone}</span>}
            {contact.linkedin && <a href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><Linkedin className="h-4 w-4" />LinkedIn</a>}
          </div>
          {contact.notes && (
            <div>
              <h3 className="font-display text-sm font-semibold mb-1">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Added {new Date(contact.created_at).toLocaleDateString()}</p>
        </div>
      )}

      {/* Follow-Up Reminders */}
      <div className="glass-card rounded-xl p-6">
        <ContactReminders contactId={contact.id} contactName={contact.name} />
      </div>

      {/* Relationship Timeline */}
      <div className="glass-card rounded-xl p-6">
        <ContactTimeline contactId={contact.id} contactName={contact.name} />
      </div>
    </div>
  );
}

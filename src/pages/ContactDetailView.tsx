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
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (!contact) {
    return <div className="p-6 text-center text-muted-foreground">Contact not found. <Link to="/dashboard" className="text-primary">Go back</Link></div>;
  }

  const startEdit = () => {
    setForm({
      name: contact.name, company: contact.company, job_title: contact.job_title,
      email: contact.email, phone: contact.phone, linkedin_url: contact.linkedin_url,
      meeting_location: contact.meeting_location, notes: contact.notes,
      importance: contact.importance, tags: contact.tags.join(", "),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        updates: {
          name: form.name, company: form.company, job_title: form.job_title,
          email: form.email, phone: form.phone, linkedin_url: form.linkedin_url,
          meeting_location: form.meeting_location, notes: form.notes,
          importance: form.importance, tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        },
      });
      setEditing(false);
      toast({ title: "Contact updated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contact.id);
      toast({ title: "Contact deleted" });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="font-display text-xl font-bold flex-1">{contact.name}</h1>
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
            <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Meeting Location</Label><Input value={form.meeting_location} onChange={(e) => setForm({ ...form, meeting_location: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Importance</Label>
              <Select value={form.importance} onValueChange={(v) => setForm({ ...form, importance: v })}>
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
          <div className="space-y-1.5"><Label>Tags</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
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
            {contact.meeting_location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{contact.meeting_location}</span>}
            {contact.linkedin_url && <a href={contact.linkedin_url.startsWith("http") ? contact.linkedin_url : `https://${contact.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><Linkedin className="h-4 w-4" />LinkedIn</a>}
          </div>
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((t) => <span key={t} className="rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-xs font-medium">{t}</span>)}
            </div>
          )}
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
    </div>
  );
}

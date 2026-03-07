import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/useContacts";
import { useMeetings } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Search, Users, Calendar, Trash2, Building2, Mail, Phone, MapPin, Linkedin, Tag, Star } from "lucide-react";
import { Link } from "react-router-dom";

const importanceBg: Record<string, string> = {
  vip: "bg-vip/20 text-vip border-vip/30",
  high: "bg-high/20 text-high border-high/30",
  medium: "bg-medium/20 text-medium border-medium/30",
  low: "bg-low/20 text-low border-low/30",
};

export default function AppDashboard() {
  const { user, signOut } = useAuth();
  const { data: contacts = [], isLoading } = useContacts();
  const { data: meetings = [] } = useMeetings();
  const createContact = useCreateContact();
  const deleteContactMut = useDeleteContact();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", company: "", job_title: "", email: "", phone: "",
    linkedin_url: "", meeting_location: "", notes: "", importance: "medium", tags: "",
  });

  const filtered = contacts.filter((c) =>
    !search || [c.name, c.company, c.job_title, c.email, c.notes]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    try {
      await createContact.mutateAsync({
        user_id: user!.id,
        name: form.name,
        company: form.company,
        job_title: form.job_title,
        email: form.email,
        phone: form.phone,
        linkedin_url: form.linkedin_url,
        meeting_location: form.meeting_location,
        meeting_date: null,
        notes: form.notes,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        importance: form.importance,
      });
      setAddOpen(false);
      setForm({ name: "", company: "", job_title: "", email: "", phone: "", linkedin_url: "", meeting_location: "", notes: "", importance: "medium", tags: "" });
      toast({ title: "Contact added!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContactMut.mutateAsync(id);
      toast({ title: "Contact deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gap-2"><Plus className="h-4 w-4" />Add Contact</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company</Label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Corp" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Job Title</Label>
                    <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Product Manager" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@acme.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn URL</Label>
                    <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="linkedin.com/in/jane" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Where did you meet?</Label>
                    <Input value={form.meeting_location} onChange={(e) => setForm({ ...form, meeting_location: e.target.value })} placeholder="Tech Conference NYC" />
                  </div>
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
                <div className="space-y-1.5">
                  <Label>Tags (comma separated)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="investor, web3, conference" />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What did you discuss? Any follow-up actions?" rows={3} />
                </div>
                <Button onClick={handleAdd} className="w-full rounded-full" disabled={createContact.isPending}>
                  {createContact.isPending ? "Saving..." : "Save Contact"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="rounded-full" onClick={signOut}>Sign Out</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Contacts", value: contacts.length },
          { icon: Star, label: "VIP Contacts", value: contacts.filter((c) => c.importance === "vip").length },
          { icon: Calendar, label: "Meetings", value: meetings.length },
          { icon: Tag, label: "Tags Used", value: new Set(contacts.flatMap((c) => c.tags)).size },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
            <s.icon className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts by name, company, role, notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Contact list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <Users className="h-12 w-12 mx-auto opacity-30" />
          <p className="font-display text-lg">{contacts.length === 0 ? "No contacts yet" : "No matches found"}</p>
          <p className="text-sm">{contacts.length === 0 ? "Add your first contact to get started" : "Try a different search"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-xl p-5 space-y-3 group">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <Link to={`/dashboard/contacts/${c.id}`} className="font-display font-semibold text-foreground hover:text-primary transition-colors truncate block">{c.name}</Link>
                  {c.company && <p className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{c.job_title ? `${c.job_title} at ${c.company}` : c.company}</p>}
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${importanceBg[c.importance] || importanceBg.medium}`}>{c.importance}</span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                {c.meeting_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.meeting_location}</span>}
                {c.linkedin_url && <a href={c.linkedin_url.startsWith("http") ? c.linkedin_url : `https://${c.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Linkedin className="h-3 w-3" />LinkedIn</a>}
              </div>

              {c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-medium">{t}</span>
                  ))}
                </div>
              )}

              {c.notes && <p className="text-xs text-muted-foreground line-clamp-2">{c.notes}</p>}

              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/useContacts";
import { useMeetings } from "@/hooks/useContacts";
import { useReminders } from "@/hooks/useReminders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Search, Users, Calendar, Trash2, Building2, Mail, Phone, MapPin, Linkedin, Tag, Star, Bell, Filter } from "lucide-react";
import { ContactDetailPanel } from "@/components/ContactDetailPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DbContact } from "@/lib/api";
import { UpcomingRemindersWidget } from "@/components/UpcomingRemindersWidget";
import { RecentInteractionsWidget } from "@/components/RecentInteractionsWidget";
import { NetworkingInsightsWidget } from "@/components/NetworkingInsightsWidget";

const importanceBg: Record<string, string> = {
  vip: "bg-vip/15 text-vip border-vip/30",
  high: "bg-high/15 text-high border-high/30",
  medium: "bg-medium/15 text-medium border-medium/30",
  low: "bg-low/15 text-low border-low/30",
};

export default function AppDashboard() {
  const { user } = useAuth();
  const { data: contacts = [], isLoading } = useContacts();
  const { data: meetings = [] } = useMeetings();
  const { data: reminders = [] } = useReminders();
  const createContact = useCreateContact();
  const deleteContactMut = useDeleteContact();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterImportance, setFilterImportance] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<DbContact | null>(null);
  const [form, setForm] = useState({
    name: "", company: "", job_title: "", email: "", phone: "",
    linkedin_url: "", meeting_location: "", notes: "", importance: "medium", tags: "",
  });

  const filtered = contacts.filter((c) => {
    const matchesSearch = !search || [c.name, c.company, c.job_title, c.email, c.notes, ...(c.tags || [])]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filterImportance === "all" || c.importance === filterImportance;
    return matchesSearch && matchesFilter;
  });

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    try {
      await createContact.mutateAsync({
        user_id: user!.id,
        name: form.name, company: form.company, job_title: form.job_title,
        email: form.email, phone: form.phone, linkedin_url: form.linkedin_url,
        meeting_location: form.meeting_location, meeting_date: null,
        notes: form.notes, tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
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

  const vipCount = contacts.filter((c) => c.importance === "vip").length;
  const tagCount = new Set(contacts.flatMap((c) => c.tags || [])).size;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user?.user_metadata?.full_name || user?.email?.split("@")[0]}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 shadow-sm"><Plus className="h-4 w-4" /> Add Contact</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader><DialogTitle className="font-display">Add New Contact</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" /></div>
                <div className="space-y-1.5"><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Corp" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Job Title</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Product Manager" /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@acme.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" /></div>
                <div className="space-y-1.5"><Label>LinkedIn URL</Label><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="linkedin.com/in/jane" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Where did you meet?</Label><Input value={form.meeting_location} onChange={(e) => setForm({ ...form, meeting_location: e.target.value })} placeholder="Tech Conference NYC" /></div>
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
              <div className="space-y-1.5"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="investor, web3, conference" /></div>
              <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What did you discuss?" rows={3} /></div>
              <Button onClick={handleAdd} className="w-full rounded-xl" disabled={createContact.isPending}>{createContact.isPending ? "Saving..." : "Save Contact"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Contacts", value: contacts.length, color: "text-primary" },
          { icon: Star, label: "VIP Contacts", value: vipCount, color: "text-vip" },
          { icon: Calendar, label: "Meetings", value: meetings.length, color: "text-chart-2" },
          { icon: Bell, label: "Reminders", value: reminders.filter(r => !r.completed).length, color: "text-chart-3" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-card border border-border/50 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UpcomingRemindersWidget />
        <RecentInteractionsWidget />
        <NetworkOverviewWidget />
      </div>

      {/* Networking Insights */}
      <NetworkingInsightsWidget />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, company, tags, notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card border-border/50" />
        </div>
        <Select value={filterImportance} onValueChange={setFilterImportance}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl bg-card border-border/50">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contact Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Users className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {contacts.length === 0 ? "No contacts yet" : "No matches found"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {contacts.length === 0 ? "Start building your professional network by adding your first contact." : "Try a different search term or filter."}
          </p>
          {contacts.length === 0 && (
            <Button className="rounded-xl gap-2 mt-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first contact
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c, i) => {
            const initials = c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedContact(c)}
                className="rounded-xl bg-card border border-border/50 p-5 space-y-3 cursor-pointer group shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
              >
                {/* Card Header */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{c.name}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${importanceBg[c.importance] || importanceBg.medium}`}>{c.importance}</span>
                    </div>
                    {c.company && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{c.job_title ? `${c.job_title} at ${c.company}` : c.company}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  {c.meeting_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.meeting_location}</span>}
                </div>

                {/* Tags */}
                {c.tags && c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <span key={t} className="rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-[10px] font-medium">{t}</span>
                    ))}
                  </div>
                )}

                {/* Notes preview */}
                {c.notes && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{c.notes}</p>}

                {/* Delete (hover) */}
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Contact Detail Side Panel */}
      <ContactDetailPanel
        contact={selectedContact}
        open={!!selectedContact}
        onOpenChange={(open) => { if (!open) setSelectedContact(null); }}
        onDelete={(id) => handleDelete(id)}
      />
    </div>
  );
}

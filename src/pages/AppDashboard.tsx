import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/useContacts";
import { useMeetings } from "@/hooks/useContacts";
import { useReminders } from "@/hooks/useReminders";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Search, Users, Calendar, Trash2, Building2, Mail, Phone, MapPin, Linkedin, Tag, Star, Bell, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactDetailPanel } from "@/components/ContactDetailPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DbContact } from "@/lib/api";
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
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [vipOnly, setVipOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<DbContact | null>(null);
  const [form, setForm] = useState({
    name: "", company: "", job_title: "", email: "", phone: "",
    linkedin_url: "", meeting_location: "", notes: "", importance: "medium", tags: "",
  });

  const allCompanies = useMemo(() => Array.from(new Set(contacts.map(c => c.company).filter(Boolean))).sort(), [contacts]);
  const allTags = useMemo(() => Array.from(new Set(contacts.flatMap(c => c.tags || []))).sort(), [contacts]);

  const filtered = useMemo(() => contacts.filter((c) => {
    const matchesSearch = !search || [c.name, c.company, c.job_title, c.email, c.notes, ...(c.tags || [])]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCompany = filterCompany === "all" || c.company === filterCompany;
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => c.tags?.includes(tag));
    const matchesVip = !vipOnly || c.importance === "vip";
    
    return matchesSearch && matchesCompany && matchesTags && matchesVip;
  }), [contacts, search, filterCompany, selectedTags, vipOnly]);

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContactMut.mutateAsync(id);
      toast({ title: "Contact deleted" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const vipCount = useMemo(() => contacts.filter((c) => c.importance === "vip").length, [contacts]);
  const tagCount = useMemo(() => new Set(contacts.flatMap((c) => c.tags || [])).size, [contacts]);

  return (
    <div className="p-6 space-y-6 max-w-7xl w-full mx-auto px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back, {user?.user_metadata?.full_name || user?.email?.split("@")[0]}</p>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1 dark:text-white">Contacts</h1>
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
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white border border-border/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-12 rounded-lg" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </div>
          ))
        ) : (
          [
            { icon: Users, label: "Total Contacts", value: contacts.length, color: "text-primary" },
            { icon: Star, label: "VIP Contacts", value: vipCount, color: "text-vip" },
            { icon: Calendar, label: "Interactions", value: meetings.length, color: "text-chart-2" },
            { icon: Bell, label: "Reminders", value: reminders.filter(r => !r.completed).length, color: "text-chart-3" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-white dark:bg-slate-800 border border-border/50 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground dark:text-gray-100">{s.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{s.label}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4 mb-6 w-full">
        {/* Top: Search and Primary Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search contacts by name, company, tags..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-11 pl-12 pr-4 rounded-xl border border-gray-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200" 
            />
          </div>
          
          <Select value={filterCompany} onValueChange={setFilterCompany}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {allCompanies.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => setVipOnly(!vipOnly)}
            className={`h-11 px-4 rounded-xl transition-all whitespace-nowrap ${vipOnly ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <Star className={`h-4 w-4 mr-2 ${vipOnly ? 'text-yellow-600' : 'text-gray-400'}`} />
            VIP Only
          </Button>
        </div>

        {/* Bottom: Tags and Reset */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <Tag className="h-4 w-4 text-gray-400 shrink-0" />
            {allTags.length === 0 ? (
               <span className="text-sm text-gray-400 italic">No tags available</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                          : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {(search || filterCompany !== "all" || selectedTags.length > 0 || vipOnly) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterCompany("all");
                setSelectedTags([]);
                setVipOnly(false);
              }}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Contact Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-border/50 p-5 space-y-3 shadow-sm">
              <div className="flex items-start gap-3">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
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
            {contacts.length === 0 ? "Start building your professional network by adding your first contact." : "No contacts match your search criteria."}
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
                className="rounded-2xl bg-white dark:bg-slate-800 border border-border/50 dark:border-slate-700 p-5 space-y-3 cursor-pointer group shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 bg-indigo-100 flex items-center justify-center">
                      <AvatarFallback className="bg-transparent text-indigo-700 font-semibold text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors truncate">{c.name}</h3>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${c.importance === "vip" ? "bg-yellow-100 text-yellow-700" : importanceBg[c.importance] || importanceBg.medium}`}>{c.importance}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {c.company && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.job_title ? `${c.job_title} at ${c.company}` : c.company}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  {c.meeting_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.meeting_location}</span>}
                </div>
                {c.tags && c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <span key={t} className="rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-[10px] font-medium">{t}</span>
                    ))}
                  </div>
                )}
                {c.notes && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mt-2">{c.notes}</p>}
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

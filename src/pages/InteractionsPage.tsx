import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Calendar, MapPin, MessageSquare, Clock, Users, Filter, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMeetings, useCreateMeeting, useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const INTERACTION_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Call" },
  { value: "video_call", label: "Video Call" },
  { value: "conference", label: "Conference" },
  { value: "networking_event", label: "Networking Event" },
  { value: "message", label: "Message" },
];

export default function InteractionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: interactions = [], isLoading } = useMeetings();
  const { data: contacts = [] } = useContacts();
  const createInteraction = useCreateMeeting();

  const [addOpen, setAddOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    date: undefined as Date | undefined,
    time: "09:00",
    interactionType: "meeting",
    contactId: "",
    location: "",
    notes: "",
  });

  const filtered = interactions.filter((m) => {
    if (filterType !== "all" && m.meeting_type !== filterType) return false;
    if (search) {
      const contact = contacts.find((c) => c.id === m.contact_id);
      const searchLower = search.toLowerCase();
      if (!m.title.toLowerCase().includes(searchLower) && !contact?.name.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title || !form.date) return;
    const interactionTime = new Date(form.date);
    const [h, m] = form.time.split(":").map(Number);
    interactionTime.setHours(h, m);

    createInteraction.mutate(
      {
        user_id: user.id,
        title: form.title,
        meeting_type: form.interactionType,
        location: form.location || "",
        meeting_time: interactionTime.toISOString(),
        notes: form.notes,
        status: "completed",
        contact_id: form.contactId || null,
        meeting_link: "",
      },
      {
        onSuccess: () => {
          toast({ title: "Interaction saved!" });
          setForm({ title: "", date: undefined, time: "09:00", interactionType: "meeting", contactId: "", location: "", notes: "" });
          setAddOpen(false);
        },
      }
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("meetings").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Interaction deleted" });
    } catch {
      toast({ title: "Error deleting", variant: "destructive" });
    }
  };

  const getTypeLabel = (type: string) => INTERACTION_TYPES.find((t) => t.value === type)?.label || type.replace("_", " ");

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Interactions</h1>
          <p className="text-sm text-muted-foreground">Track all your professional interactions including meetings, calls, conferences, and networking events.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Interaction</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Add Interaction</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Interaction Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Coffee chat with Sarah" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Interaction Type</Label>
                  <Select value={form.interactionType} onValueChange={(v) => setForm((f) => ({ ...f, interactionType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INTERACTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Contact</Label>
                  <Select value={form.contactId} onValueChange={(v) => setForm((f) => ({ ...f, contactId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.date && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {form.date ? format(form.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker mode="single" selected={form.date} onSelect={(d) => setForm((f) => ({ ...f, date: d }))} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label>Time</Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Office / Zoom / Coffee shop" />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Discussion topics, key takeaways..." rows={3} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createInteraction.isPending}>Save Interaction</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search interactions..." className="pl-9 bg-card border-border/50" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border/50">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {INTERACTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Interaction List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">No interactions yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Start logging your professional interactions.</p>
          <Button className="mt-4 gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add your first interaction
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m, i) => {
            const contact = contacts.find((c) => c.id === m.contact_id);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border/50 bg-card p-5 space-y-2 shadow-sm group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{m.title}</h3>
                    {contact && <p className="text-sm text-muted-foreground">with {contact.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{getTypeLabel(m.meeting_type)}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {m.meeting_time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(m.meeting_time), "PPp")}</span>}
                  {m.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>}
                </div>
                {m.notes && <p className="text-sm text-muted-foreground">{m.notes}</p>}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

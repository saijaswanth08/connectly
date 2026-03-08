import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Calendar, MapPin, Clock, Filter, Search, Trash2, Pencil, Eye, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting, useContacts } from "@/hooks/useContacts";
import { useCreateReminder } from "@/hooks/useReminders";
import { useCreateTimelineEvent } from "@/hooks/useTimeline";
import { cn } from "@/lib/utils";
import { DbMeeting } from "@/lib/api";
import { Link } from "react-router-dom";

const INTERACTION_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Call" },
  { value: "video_call", label: "Video Call" },
  { value: "conference", label: "Conference" },
  { value: "networking_event", label: "Networking Event" },
  { value: "message", label: "Message" },
  { value: "business_meeting", label: "Business Meeting" },
  { value: "phone_call", label: "Phone Call" },
];

const emptyForm = {
  title: "",
  date: undefined as Date | undefined,
  time: "09:00",
  interactionType: "meeting",
  contactId: "",
  location: "",
  notes: "",
  createFollowUp: false,
};

export default function InteractionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: interactions = [], isLoading } = useMeetings();
  const { data: contacts = [] } = useContacts();
  const createInteraction = useCreateMeeting();
  const updateInteraction = useUpdateMeeting();
  const deleteInteraction = useDeleteMeeting();
  const createReminder = useCreateReminder();
  const createTimelineEvent = useCreateTimelineEvent();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<DbMeeting | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = interactions.filter((m) => {
    if (filterType !== "all" && m.meeting_type !== filterType) return false;
    if (search) {
      const contact = contacts.find((c) => c.id === m.contact_id);
      const s = search.toLowerCase();
      if (!m.title.toLowerCase().includes(s) && !contact?.name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const resetForm = () => setForm({ ...emptyForm });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title || !form.date) return;
    const dt = new Date(form.date);
    const [h, m] = form.time.split(":").map(Number);
    dt.setHours(h, m);
    const contact = contacts.find((c) => c.id === form.contactId);

    createInteraction.mutate(
      {
        user_id: user.id,
        title: form.title,
        meeting_type: form.interactionType,
        location: form.location || "",
        meeting_time: dt.toISOString(),
        notes: form.notes,
        status: "completed",
        contact_id: form.contactId || null,
        meeting_link: "",
      },
      {
        onSuccess: async () => {
          toast({ title: "Interaction saved!" });

          // Auto-create timeline event
          if (form.contactId) {
            try {
              await createTimelineEvent.mutateAsync({
                user_id: user.id,
                contact_id: form.contactId,
                event_type: form.interactionType,
                title: `${getTypeLabel(form.interactionType)} — ${form.title}`,
                description: form.notes || "",
                event_date: dt.toISOString(),
              });
            } catch { /* silent */ }
          }

          // Auto-create follow-up reminder
          if (form.createFollowUp && form.contactId) {
            const followUpDate = new Date(dt);
            followUpDate.setDate(followUpDate.getDate() + 7);
            followUpDate.setHours(10, 0, 0, 0);
            try {
              await createReminder.mutateAsync({
                user_id: user.id,
                title: `Follow up with ${contact?.name || "contact"}`,
                message: `Follow up after: ${form.title}`,
                contact_id: form.contactId,
                reminder_date: followUpDate.toISOString(),
                completed: false,
              });
              toast({ title: "Follow-up reminder created!" });
            } catch { /* silent */ }
          }

          resetForm();
          setAddOpen(false);
        },
      }
    );
  };

  const openEdit = (m: DbMeeting) => {
    setSelectedInteraction(m);
    setForm({
      title: m.title,
      date: m.meeting_time ? new Date(m.meeting_time) : undefined,
      time: m.meeting_time ? format(new Date(m.meeting_time), "HH:mm") : "09:00",
      interactionType: m.meeting_type,
      contactId: m.contact_id || "",
      location: m.location || "",
      notes: m.notes || "",
      createFollowUp: false,
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInteraction || !form.title) return;
    const dt = form.date ? new Date(form.date) : undefined;
    if (dt) {
      const [h, m] = form.time.split(":").map(Number);
      dt.setHours(h, m);
    }
    updateInteraction.mutate(
      {
        id: selectedInteraction.id,
        updates: {
          title: form.title,
          meeting_type: form.interactionType,
          location: form.location,
          meeting_time: dt?.toISOString() || null,
          notes: form.notes,
          contact_id: form.contactId || null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Interaction updated!" });
          resetForm();
          setEditOpen(false);
          setSelectedInteraction(null);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteInteraction.mutate(id, {
      onSuccess: () => toast({ title: "Interaction deleted" }),
      onError: () => toast({ title: "Error deleting", variant: "destructive" }),
    });
  };

  const openDetail = (m: DbMeeting) => {
    setSelectedInteraction(m);
    setDetailOpen(true);
  };

  const getTypeLabel = (type: string) => INTERACTION_TYPES.find((t) => t.value === type)?.label || type.replace(/_/g, " ");

  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string, isPending: boolean) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Interaction Title *</Label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="TechCrunch Disrupt" required />
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
        <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="San Francisco / Zoom / Office" />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Discussion topics, key takeaways..." rows={3} />
      </div>
      {form.contactId && (
        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Create follow-up reminder (7 days later)</span>
          </div>
          <Switch checked={form.createFollowUp} onCheckedChange={(v) => setForm((f) => ({ ...f, createFollowUp: v }))} />
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => { resetForm(); setAddOpen(false); setEditOpen(false); }}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Interactions</h1>
          <p className="text-sm text-muted-foreground">Track all your professional interactions including meetings, calls, conferences, and networking events.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Add Interaction</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Add Interaction</DialogTitle>
              <DialogDescription>Record a new professional interaction.</DialogDescription>
            </DialogHeader>
            {renderForm(handleAdd, "Save Interaction", createInteraction.isPending)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search interactions..." className="pl-9 bg-card border-border/50 rounded-xl" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border/50 rounded-xl">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {INTERACTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
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
          <Button className="mt-4 gap-2 rounded-xl" onClick={() => setAddOpen(true)}>
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
                  <div className="cursor-pointer" onClick={() => openDetail(m)}>
                    <h3 className="font-display font-semibold text-foreground hover:text-primary transition-colors">{m.title}</h3>
                    {contact && <p className="text-sm text-muted-foreground">with {contact.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{getTypeLabel(m.meeting_type)}</Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(m)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {m.meeting_time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(m.meeting_time), "PPp")}</span>}
                  {m.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>}
                </div>
                {m.notes && <p className="text-sm text-muted-foreground line-clamp-2">{m.notes}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { resetForm(); setSelectedInteraction(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Interaction</DialogTitle>
            <DialogDescription>Update the interaction details.</DialogDescription>
          </DialogHeader>
          {renderForm(handleEdit, "Save Changes", updateInteraction.isPending)}
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setSelectedInteraction(null); }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">{selectedInteraction?.title}</SheetTitle>
          </SheetHeader>
          {selectedInteraction && (() => {
            const contact = contacts.find((c) => c.id === selectedInteraction.contact_id);
            return (
              <div className="space-y-5 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{getTypeLabel(selectedInteraction.meeting_type)}</Badge>
                    <Badge variant="outline" className="capitalize">{selectedInteraction.status}</Badge>
                  </div>
                  {contact && (
                    <div>
                      <p className="text-xs text-muted-foreground">Contact</p>
                      <Link to={`/dashboard/contacts/${contact.id}`} className="text-sm font-medium text-primary hover:underline">{contact.name}</Link>
                    </div>
                  )}
                  {selectedInteraction.meeting_time && (
                    <div>
                      <p className="text-xs text-muted-foreground">Date & Time</p>
                      <p className="text-sm">{format(new Date(selectedInteraction.meeting_time), "PPPp")}</p>
                    </div>
                  )}
                  {selectedInteraction.location && (
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm">{selectedInteraction.location}</p>
                    </div>
                  )}
                  {selectedInteraction.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedInteraction.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setDetailOpen(false); openEdit(selectedInteraction); }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => { handleDelete(selectedInteraction.id); setDetailOpen(false); }}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                  {contact && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={async () => {
                        if (!user) return;
                        const followUpDate = new Date();
                        followUpDate.setDate(followUpDate.getDate() + 7);
                        followUpDate.setHours(10, 0, 0, 0);
                        try {
                          await createReminder.mutateAsync({
                            user_id: user.id,
                            title: `Follow up with ${contact.name}`,
                            message: `Follow up after: ${selectedInteraction.title}`,
                            contact_id: contact.id,
                            reminder_date: followUpDate.toISOString(),
                            completed: false,
                          });
                          toast({ title: "Follow-up reminder created!" });
                        } catch {
                          toast({ title: "Error", variant: "destructive" });
                        }
                      }}
                      disabled={createReminder.isPending}
                    >
                      <Bell className="h-3.5 w-3.5" /> Create Follow-Up
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { useState } from "react";
import { format } from "date-fns";
import { UserPlus, Video, Bell, FileText, RefreshCw, Phone, MessageSquare, Plus, Search, Trash2, CalendarIcon, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTimelineEvents, useCreateTimelineEvent, useDeleteTimelineEvent } from "@/hooks/useTimeline";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { value: "meeting", label: "Meeting", icon: Video },
  { value: "call", label: "Call", icon: Phone },
  { value: "message", label: "Message", icon: MessageSquare },
  { value: "note", label: "Note", icon: FileText },
  { value: "follow_up", label: "Follow-up", icon: RefreshCw },
  { value: "contact_added", label: "Contact Added", icon: UserPlus },
  { value: "reminder", label: "Reminder", icon: Bell },
];

const eventIcon = (type: string) => {
  const found = EVENT_TYPES.find((e) => e.value === type);
  return found?.icon || FileText;
};

const eventColor = (type: string) => {
  const colors: Record<string, string> = {
    meeting: "bg-primary/10 text-primary border-primary/20",
    call: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    message: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    note: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    follow_up: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    contact_added: "bg-accent text-accent-foreground border-accent",
    reminder: "bg-vip/10 text-vip border-vip/20",
  };
  return colors[type] || "bg-muted text-muted-foreground border-border";
};

interface ContactTimelineProps {
  contactId: string;
  contactName: string;
}

export function ContactTimeline({ contactId, contactName }: ContactTimelineProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: events = [], isLoading } = useTimelineEvents(contactId);
  const createEvent = useCreateTimelineEvent();
  const deleteEvent = useDeleteTimelineEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Form state
  const [eventType, setEventType] = useState("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("10:00");

  const filtered = events.filter((e) => {
    const matchesFilter = filter === "all" || e.event_type === filter;
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  function resetForm() {
    setEventType("note");
    setTitle("");
    setDescription("");
    setDate(undefined);
    setTime("10:00");
  }

  async function handleSave() {
    if (!title || !user) return;
    const eventDate = date ? new Date(date) : new Date();
    if (date) {
      const [h, m] = time.split(":").map(Number);
      eventDate.setHours(h, m, 0, 0);
    }
    try {
      await createEvent.mutateAsync({
        user_id: user.id,
        contact_id: contactId,
        event_type: eventType,
        title,
        description,
        event_date: eventDate.toISOString(),
      });
      toast({ title: "Interaction added" });
      setFormOpen(false);
      resetForm();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    await deleteEvent.mutateAsync(id);
    toast({ title: "Event removed" });
  }

  // Group events by date
  const grouped: Record<string, typeof events> = {};
  filtered.forEach((e) => {
    const key = format(new Date(e.event_date), "MMMM d, yyyy");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-sm font-semibold text-foreground">Relationship Timeline</h3>
        <Button size="sm" variant="outline" onClick={() => { resetForm(); setFormOpen(true); }} className="gap-1.5 text-xs">
          <Plus className="h-3 w-3" /> Add Interaction
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search interactions…" className="pl-8 h-8 text-xs" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-2">No interactions recorded yet.</p>
          <Button size="sm" variant="outline" onClick={() => { resetForm(); setFormOpen(true); }} className="gap-1.5">
            <Plus className="h-3 w-3" /> Add First Interaction
          </Button>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          <AnimatePresence>
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel} className="mb-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 -ml-6 pl-6">{dateLabel}</p>
                {items.map((event, i) => {
                  const Icon = eventIcon(event.event_type);
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative mb-3 group"
                    >
                      {/* Dot */}
                      <div className={cn("absolute -left-6 top-2.5 h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center", eventColor(event.event_type))}>
                        <Icon className="h-3 w-3" />
                      </div>

                      <div className="rounded-lg border border-border/50 bg-card px-4 py-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border", eventColor(event.event_type))}>
                                {EVENT_TYPES.find((t) => t.value === event.event_type)?.label || event.event_type}
                              </span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {format(new Date(event.event_date), "h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground mt-1">{event.title}</p>
                            {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                          </div>
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(event.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Interaction Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Interaction</DialogTitle>
            <DialogDescription>Record an interaction with {contactName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Interaction Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.filter((t) => t.value !== "contact_added").map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What happened?" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "MMM d, yyyy") : "Today"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!title || createEvent.isPending}>Save Interaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

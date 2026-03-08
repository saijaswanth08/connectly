import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Video, Plus, Copy, Link, Clock, Users, CalendarIcon, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMeetings, useCreateMeeting } from "@/hooks/useContacts";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";

function generateMeetingLink() {
  const id = Math.random().toString(36).substring(2, 10);
  return `https://meet.connectly.app/room-${id}`;
}

export default function VideoMeetingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: meetings = [], isLoading } = useMeetings();
  const { data: contacts = [] } = useContacts();
  const createMeeting = useCreateMeeting();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: undefined as Date | undefined,
    time: "09:00",
    meetingType: "video_call",
    contactId: "",
    notes: "",
    meetingLink: "",
  });

  const handleInstantMeeting = () => {
    if (!user) return;
    const link = generateMeetingLink();
    createMeeting.mutate(
      {
        user_id: user.id,
        title: "Instant Meeting",
        meeting_link: link,
        meeting_type: "video_call",
        location: "Online",
        meeting_time: new Date().toISOString(),
        notes: "",
        status: "in_progress",
        contact_id: null,
      },
      {
        onSuccess: () => {
          toast({
            title: "Meeting created!",
            description: "Your meeting link is ready. Share it with participants.",
          });
          copyToClipboard(link, "instant");
        },
      }
    );
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title || !form.date) return;
    const link = form.meetingLink || generateMeetingLink();
    const meetingTime = new Date(form.date);
    const [h, m] = form.time.split(":").map(Number);
    meetingTime.setHours(h, m);

    createMeeting.mutate(
      {
        user_id: user.id,
        title: form.title,
        meeting_link: link,
        meeting_type: form.meetingType,
        location: "Online",
        meeting_time: meetingTime.toISOString(),
        notes: form.notes,
        status: "scheduled",
        contact_id: form.contactId || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Meeting scheduled!", description: `"${form.title}" has been scheduled.` });
          setForm({ title: "", date: undefined, time: "09:00", meetingType: "video_call", contactId: "", notes: "", meetingLink: "" });
          setScheduleOpen(false);
        },
      }
    );
  };

  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const upcoming = meetings.filter((m) => m.status === "scheduled" && m.meeting_time && new Date(m.meeting_time) >= new Date());
  const past = meetings.filter((m) => m.status !== "scheduled" || (m.meeting_time && new Date(m.meeting_time) < new Date()));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Video Meetings</h1>
          <p className="text-sm text-muted-foreground">Create, schedule, and manage your meeting links</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleInstantMeeting} className="gap-2" disabled={createMeeting.isPending}>
            <Video className="h-4 w-4" /> Start Instant Meeting
          </Button>
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Schedule a Meeting</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Meeting Title *</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Weekly sync" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.date ? format(form.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={form.date} onSelect={(d) => setForm((f) => ({ ...f, date: d }))} disabled={(d) => d < new Date()} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Meeting Type</Label>
                    <Select value={form.meetingType} onValueChange={(v) => setForm((f) => ({ ...f, meetingType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video_call">Video Call</SelectItem>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact</Label>
                    <Select value={form.contactId} onValueChange={(v) => setForm((f) => ({ ...f, contactId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                      <SelectContent>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="link">Meeting Link (optional)</Label>
                  <Input id="link" value={form.meetingLink} onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))} placeholder="https://zoom.us/j/... or leave blank to auto-generate" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Description</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Agenda or notes..." rows={3} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMeeting.isPending}>Schedule</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcoming.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No upcoming meetings</p>
              <p className="text-sm">Start an instant meeting or schedule one above.</p>
            </div>
          )}
          {upcoming.map((m, i) => {
            const contact = contacts.find((c) => c.id === m.contact_id);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-card-foreground">{m.title}</h3>
                    {contact && <p className="text-sm text-muted-foreground">with {contact.name}</p>}
                  </div>
                  <Badge variant="secondary" className="capitalize">{m.meeting_type.replace("_", " ")}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {m.meeting_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(m.meeting_time), "PPp")}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Up to 30 participants</span>
                </div>
                {m.meeting_link && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">{m.meeting_link}</code>
                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => copyToClipboard(m.meeting_link, m.id)}>
                      {copiedId === m.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === m.id ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0" asChild>
                      <a href={m.meeting_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> Join
                      </a>
                    </Button>
                  </div>
                )}
                {m.notes && <p className="text-sm text-muted-foreground">{m.notes}</p>}
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          {past.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No past meetings yet</p>
            </div>
          )}
          {past.map((m, i) => {
            const contact = contacts.find((c) => c.id === m.contact_id);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm opacity-80">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-card-foreground">{m.title}</h3>
                    {contact && <p className="text-sm text-muted-foreground">with {contact.name}</p>}
                  </div>
                  <Badge variant="outline" className="capitalize">{m.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {m.meeting_time && (
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(m.meeting_time), "PPp")}</span>
                  )}
                  <span className="flex items-center gap-1"><Link className="h-3.5 w-3.5" />{m.meeting_type.replace("_", " ")}</span>
                </div>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

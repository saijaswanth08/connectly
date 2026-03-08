import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Video, Plus, Copy, Clock, Users, CalendarIcon, Check, ExternalLink, LogIn, Bell, Sparkles, Loader2 } from "lucide-react";
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
import { useMeetings, useCreateMeeting, useContacts } from "@/hooks/useContacts";
import { useCreateReminder } from "@/hooks/useReminders";
import { JitsiMeetingRoom } from "@/components/JitsiMeetingRoom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

function generateRoomId() {
  const id = Math.random().toString(36).substring(2, 8);
  return `connectly-meeting-${id}`;
}

export default function VideoMeetingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: meetings = [] } = useMeetings();
  const { data: contacts = [] } = useContacts();
  const createMeeting = useCreateMeeting();

  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [lastMeetingContactId, setLastMeetingContactId] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const createReminder = useCreateReminder();
  const [joinCode, setJoinCode] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [generatingAi, setGeneratingAi] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: undefined as Date | undefined,
    time: "09:00",
    meetingType: "video_call",
    contactId: "",
    notes: "",
  });

  const handleInstantMeeting = () => {
    if (!user) return;
    const roomId = generateRoomId();
    createMeeting.mutate(
      {
        user_id: user.id,
        title: "Instant Meeting",
        meeting_link: `https://meet.jit.si/${roomId}`,
        meeting_type: "video_call",
        location: "Online",
        meeting_time: new Date().toISOString(),
        notes: "",
        status: "in_progress",
        contact_id: null,
      },
      {
        onSuccess: () => {
          setActiveRoom(roomId);
          toast({ title: "Meeting started!", description: "Your meeting room is live." });
        },
      }
    );
  };

  const handleJoinMeeting = () => {
    const code = joinCode.trim();
    if (!code) return;
    // Support full URL or just room code
    const roomId = code.includes("meet.jit.si/")
      ? code.split("meet.jit.si/")[1]?.split(/[#?]/)[0]
      : code;
    if (roomId) {
      setActiveRoom(roomId);
      setJoinCode("");
    }
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title || !form.date) return;
    const roomId = generateRoomId();
    const meetingTime = new Date(form.date);
    const [h, m] = form.time.split(":").map(Number);
    meetingTime.setHours(h, m);

    createMeeting.mutate(
      {
        user_id: user.id,
        title: form.title,
        meeting_link: `https://meet.jit.si/${roomId}`,
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
          setForm({ title: "", date: undefined, time: "09:00", meetingType: "video_call", contactId: "", notes: "" });
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

  const joinFromHistory = (link: string) => {
    const roomId = link.includes("meet.jit.si/")
      ? link.split("meet.jit.si/")[1]?.split(/[#?]/)[0]
      : null;
    if (roomId) setActiveRoom(roomId);
  };

  const handleLeaveRoom = () => {
    const lastMeeting = meetings.find((m) => m.meeting_link?.includes(activeRoom!));
    if (lastMeeting?.contact_id) {
      setLastMeetingContactId(lastMeeting.contact_id);
      setShowFollowUp(true);
    }
    setActiveRoom(null);
  };

  const handleGenerateAiNotes = async (meeting: typeof meetings[0]) => {
    const contact = contacts.find((c) => c.id === meeting.contact_id);
    setGeneratingAi(meeting.id);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meeting-notes", {
        body: { meetingTitle: meeting.title, contactName: contact?.name, notes: meeting.notes },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiSummaries((prev) => ({ ...prev, [meeting.id]: data.summary }));
      toast({ title: "AI summary generated!" });
    } catch (e: any) {
      toast({ title: "Error generating summary", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingAi(null);
    }
  };

  const handleCreateFollowUp = async () => {
    if (!user || !lastMeetingContactId) return;
    const contact = contacts.find((c) => c.id === lastMeetingContactId);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    await createReminder.mutateAsync({
      user_id: user.id,
      title: `Follow up with ${contact?.name || "contact"}`,
      message: "Follow up after video meeting",
      contact_id: lastMeetingContactId,
      reminder_date: tomorrow.toISOString(),
      completed: false,
    });
    toast({ title: "Follow-up reminder created!" });
    setShowFollowUp(false);
    setLastMeetingContactId(null);
  };

  // If a meeting room is active, show the embedded Jitsi view
  if (activeRoom) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <JitsiMeetingRoom roomId={activeRoom} onLeave={handleLeaveRoom} title="Connectly Meeting" />
      </div>
    );
  }

  const upcoming = meetings.filter((m) => m.status === "scheduled" && m.meeting_time && new Date(m.meeting_time) >= new Date());
  const past = meetings.filter((m) => m.status !== "scheduled" || (m.meeting_time && new Date(m.meeting_time) < new Date()));

  const followUpContact = lastMeetingContactId ? contacts.find((c) => c.id === lastMeetingContactId) : null;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Follow-up suggestion after meeting */}
      {showFollowUp && followUpContact && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/30 bg-accent/50 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Suggested Follow-Up</p>
              <p className="text-xs text-muted-foreground">You had a meeting with {followUpContact.name}. Would you like to schedule a follow-up?</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => { setShowFollowUp(false); setLastMeetingContactId(null); }}>Skip</Button>
            <Button size="sm" onClick={handleCreateFollowUp} disabled={createReminder.isPending} className="gap-1.5">
              <Bell className="h-3.5 w-3.5" /> Create Reminder
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Video Meetings</h1>
          <p className="text-sm text-muted-foreground">Start, join, or schedule video meetings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleInstantMeeting} className="gap-2" disabled={createMeeting.isPending}>
            <Video className="h-4 w-4" /> Start Instant Meeting
          </Button>
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Schedule</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle className="font-display">Schedule a Meeting</DialogTitle></DialogHeader>
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
                <div className="space-y-1.5">
                  <Label>Contact (optional)</Label>
                  <Select value={form.contactId} onValueChange={(v) => setForm((f) => ({ ...f, contactId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
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

      {/* Join Meeting */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display font-semibold mb-3">Join a Meeting</h2>
        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter meeting code or link (e.g. connectly-meeting-abc123)"
            onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
          />
          <Button onClick={handleJoinMeeting} className="gap-2 shrink-0" disabled={!joinCode.trim()}>
            <LogIn className="h-4 w-4" /> Join
          </Button>
        </div>
      </div>

      {/* Meeting History */}
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
                  {m.meeting_time && (<span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(m.meeting_time), "PPp")}</span>)}
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Up to 30 participants</span>
                </div>
                {m.meeting_link && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">{m.meeting_link}</code>
                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => copyToClipboard(m.meeting_link!, m.id)}>
                      {copiedId === m.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === m.id ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" variant="default" className="gap-1.5 shrink-0" onClick={() => joinFromHistory(m.meeting_link!)}>
                      <Video className="h-3.5 w-3.5" /> Join
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
                  {m.meeting_time && (<span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(m.meeting_time), "PPp")}</span>)}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleGenerateAiNotes(m)} disabled={generatingAi === m.id}>
                    {generatingAi === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {generatingAi === m.id ? "Generating..." : "AI Summary"}
                  </Button>
                </div>
                {aiSummaries[m.id] && (
                  <div className="mt-2 rounded-lg bg-accent/50 border border-border/50 p-4 text-sm text-foreground whitespace-pre-wrap">
                    {aiSummaries[m.id]}
                  </div>
                )}
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

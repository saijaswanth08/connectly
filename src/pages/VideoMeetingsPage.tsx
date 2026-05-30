import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Video, Plus, Copy, Clock, Users, CalendarIcon, Check, ExternalLink, LogIn, Bell, Sparkles, Loader2, FileText, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMeetings, useCreateMeeting, useUpdateMeeting, useContacts } from "@/hooks/useContacts";
import { useCreateReminder } from "@/hooks/useReminders";
import { JitsiMeetingRoom } from "@/components/JitsiMeetingRoom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

function generateRoomId() {
  const id = Math.random().toString(36).substring(2, 8);
  return `connectly-meeting-${id}`;
}

interface AiResult {
  summary: string;
  actionItems: string[];
}

export default function VideoMeetingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: meetings = [] } = useMeetings();
  const { data: contacts = [] } = useContacts();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const queryClient = useQueryClient();

  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [activeMeetingNotes, setActiveMeetingNotes] = useState<string>("");
  const [lastMeetingContactId, setLastMeetingContactId] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const createReminder = useCreateReminder();
  const [joinCode, setJoinCode] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI summaries: keyed by meeting id, stores parsed result
  const [aiResults, setAiResults] = useState<Record<string, AiResult>>({});
  const [generatingAi, setGeneratingAi] = useState<string | null>(null);
  const [expandedAi, setExpandedAi] = useState<string | null>(null);
  const [addingReminder, setAddingReminder] = useState<string | null>(null);

  // Edit Notes sheet
  const [editNotesId, setEditNotesId] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

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
        meeting_link: `https://konferenz.netzbegruenung.de/${roomId}`,
        meeting_type: "video_call",
        location: "Online",
        meeting_time: new Date().toISOString(),
        notes: "",
        status: "in_progress",
        contact_id: null,
      },
      {
        onSuccess: (newMeeting) => {
          setActiveRoom(roomId);
          setActiveMeetingId(newMeeting.id);
          setActiveMeetingNotes(newMeeting.notes || "");
          toast({ title: "Meeting started!", description: "Your meeting room is live." });
          supabase.from("timeline_events").insert({
            user_id: user.id,
            contact_id: newMeeting.contact_id || null,
            event_type: "meeting",
            title: "Instant Meeting started",
            description: "",
            event_date: new Date().toISOString(),
          }).then(() => {}, () => {});
        },
      }
    );
  };

  const handleJoinMeeting = () => {
    const code = joinCode.trim();
    if (!code) return;
    const roomId = code.includes("konferenz.netzbegruenung.de/")
      ? code.split("konferenz.netzbegruenung.de/")[1]?.split(/[#?]/)[0]
      : code.includes("meet.ffmuc.net/")
      ? code.split("meet.ffmuc.net/")[1]?.split(/[#?]/)[0]
      : code.includes("meet.jit.si/")
      ? code.split("meet.jit.si/")[1]?.split(/[#?]/)[0]
      : code;
    if (roomId) {
      setActiveRoom(roomId);
      setActiveMeetingId(null);
      setActiveMeetingNotes("");
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
        meeting_link: `https://konferenz.netzbegruenung.de/${roomId}`,
        meeting_type: form.meetingType,
        location: "Online",
        meeting_time: meetingTime.toISOString(),
        notes: form.notes,
        status: "scheduled",
        contact_id: form.contactId || null,
      },
      {
        onSuccess: (newMeeting) => {
          toast({ title: "Meeting scheduled!", description: `"${form.title}" has been scheduled.` });
          setForm({ title: "", date: undefined, time: "09:00", meetingType: "video_call", contactId: "", notes: "" });
          setScheduleOpen(false);
          if (form.contactId) {
            supabase.from("timeline_events").insert({
              user_id: user.id,
              contact_id: form.contactId,
              event_type: "meeting",
              title: `Scheduled: ${form.title}`,
              description: form.notes || "",
              event_date: meetingTime.toISOString(),
            }).then(() => {}, () => {});
          }
        },
      }
    );
  };

  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const joinFromHistory = (meeting: typeof meetings[0]) => {
    const link = meeting.meeting_link || "";
    const roomId = link.includes("konferenz.netzbegruenung.de/")
      ? link.split("konferenz.netzbegruenung.de/")[1]?.split(/[#?]/)[0]
      : link.includes("meet.ffmuc.net/")
      ? link.split("meet.ffmuc.net/")[1]?.split(/[#?]/)[0]
      : link.includes("meet.jit.si/")
      ? link.split("meet.jit.si/")[1]?.split(/[#?]/)[0]
      : null;
    if (roomId) {
      setActiveRoom(roomId);
      setActiveMeetingId(meeting.id);
      setActiveMeetingNotes(meeting.notes || "");
    }
  };

  const handleLeaveRoom = () => {
    const lastMeeting = meetings.find((m) => m.meeting_link?.includes(activeRoom!));
    if (lastMeeting?.contact_id) {
      setLastMeetingContactId(lastMeeting.contact_id);
      setShowFollowUp(true);
    }
    setActiveRoom(null);
    setActiveMeetingId(null);
    setActiveMeetingNotes("");
    // Force-refresh meetings so notes saved during the session appear immediately
    queryClient.invalidateQueries({ queryKey: ["meetings"] });
  };

  // Client-side smart summary — no API key needed
  const generateSmartSummary = (meeting: typeof meetings[0], contactName?: string): AiResult => {
    const notes = (meeting.notes || "").trim();
    const title = meeting.title || "Meeting";

    if (!notes) {
      return {
        summary: `${title}${contactName ? ` with ${contactName}` : ""} was held on ${meeting.meeting_time ? new Date(meeting.meeting_time).toLocaleDateString() : "a past date"}. No notes were recorded for this meeting.`,
        actionItems: [],
      };
    }

    // Split into lines/sentences
    const lines = notes
      .split(/[\n•\-*]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    const sentences = notes
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    // Build summary from first 2-3 meaningful sentences
    const summaryParts = sentences.slice(0, 3);
    const summary = summaryParts.length > 0
      ? `${title}${contactName ? ` with ${contactName}` : ""}: ${summaryParts.join(". ")}.`
      : `${title}${contactName ? ` with ${contactName}` : ""} covered the topics noted below.`;

    // Detect action items using keyword patterns
    const actionKeywords = [
      /\b(follow[\s-]?up|send|email|call|schedule|book|arrange|confirm|check|review|share|prepare|draft|update|create|reach out|connect|set up|look into|discuss|meeting)\b/i,
    ];
    const actionItems: string[] = [];

    for (const line of lines) {
      const isAction = actionKeywords.some((rx) => rx.test(line));
      if (isAction && actionItems.length < 4) {
        // Capitalize first letter
        const cleaned = line.charAt(0).toUpperCase() + line.slice(1);
        if (!actionItems.includes(cleaned)) actionItems.push(cleaned);
      }
    }

    // If no action items found, suggest generic ones based on context
    if (actionItems.length === 0 && sentences.length > 0) {
      actionItems.push(`Follow up on topics discussed in ${title}`);
      if (contactName) actionItems.push(`Send a recap email to ${contactName}`);
    }

    return { summary, actionItems };
  };

  const handleGenerateAiNotes = (meeting: typeof meetings[0]) => {
    const contact = contacts.find((c) => c.id === meeting.contact_id);
    setGeneratingAi(meeting.id);

    // Simulate brief processing feel (instant in reality)
    setTimeout(() => {
      const result = generateSmartSummary(meeting, contact?.name);
      setAiResults((prev) => ({ ...prev, [meeting.id]: result }));
      setExpandedAi(meeting.id);
      toast({ title: "Summary ready!" });
      setGeneratingAi(null);
    }, 600);
  };


  const handleAddActionToReminder = async (meetingId: string, actionItem: string) => {
    if (!user) return;
    const key = `${meetingId}-${actionItem}`;
    setAddingReminder(key);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    try {
      await createReminder.mutateAsync({
        user_id: user.id,
        title: actionItem,
        message: "Action item from AI meeting summary",
        contact_id: null,
        reminder_date: tomorrow.toISOString(),
        completed: false,
      });
      toast({ title: "Reminder added!", description: actionItem });
    } catch {
      toast({ title: "Failed to add reminder", variant: "destructive" });
    } finally {
      setAddingReminder(null);
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

  const openEditNotes = (meeting: typeof meetings[0]) => {
    setEditNotesId(meeting.id);
    setEditNotesValue(meeting.notes || "");
  };

  const handleSaveNotes = async () => {
    if (!editNotesId) return;
    setSavingNotes(true);
    try {
      await updateMeeting.mutateAsync({ id: editNotesId, updates: { notes: editNotesValue } });
      toast({ title: "Notes saved!" });
      setEditNotesId(null);
    } catch {
      toast({ title: "Failed to save notes", variant: "destructive" });
    } finally {
      setSavingNotes(false);
    }
  };

  // If a meeting room is active, show the embedded Jitsi view
  if (activeRoom) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <JitsiMeetingRoom
          roomId={activeRoom}
          onLeave={handleLeaveRoom}
          title="Connectly Meeting"
          meetingId={activeMeetingId}
          initialNotes={activeMeetingNotes}
        />
      </div>
    );
  }

  const upcoming = meetings.filter((m) => m.status === "scheduled" && m.meeting_time && new Date(m.meeting_time) >= new Date());
  const past = meetings.filter((m) => m.status !== "scheduled" || (m.meeting_time && new Date(m.meeting_time) < new Date()));

  const followUpContact = lastMeetingContactId ? contacts.find((c) => c.id === lastMeetingContactId) : null;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Edit Notes Sheet */}
      <Sheet open={!!editNotesId} onOpenChange={(open) => !open && setEditNotesId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Edit Meeting Notes
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col p-6 gap-4">
            <Textarea
              value={editNotesValue}
              onChange={(e) => setEditNotesValue(e.target.value)}
              placeholder={"Add your notes here...\n\n• Key discussion points\n• Decisions made\n• Action items"}
              className="flex-1 resize-none text-sm leading-relaxed min-h-[300px]"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditNotesId(null)}>Cancel</Button>
              <Button onClick={handleSaveNotes} disabled={savingNotes} className="gap-2">
                {savingNotes && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Notes
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
                    {m.notes && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 italic">
                        {m.notes.length > 100 ? m.notes.slice(0, 100) + "…" : m.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="capitalize shrink-0">{m.meeting_type.replace("_", " ")}</Badge>
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
                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => openEditNotes(m)}>
                      <FileText className="h-3.5 w-3.5" /> Notes
                    </Button>
                    <Button size="sm" variant="default" className="gap-1.5 shrink-0" onClick={() => joinFromHistory(m)}>
                      <Video className="h-3.5 w-3.5" /> Join
                    </Button>
                  </div>
                )}
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
            const aiResult = aiResults[m.id];
            const isExpanded = expandedAi === m.id;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-card-foreground">{m.title}</h3>
                    {contact && <p className="text-sm text-muted-foreground">with {contact.name}</p>}
                    {/* Notes Preview */}
                    {m.notes && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 italic">
                        {m.notes.length > 120 ? m.notes.slice(0, 120) + "…" : m.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize shrink-0 ml-2">{m.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {m.meeting_time && (<span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(m.meeting_time), "PPp")}</span>)}
                </div>
                <div className="flex gap-2 pt-1 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openEditNotes(m)}>
                    <FileText className="h-3.5 w-3.5" /> Notes
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleGenerateAiNotes(m)} disabled={generatingAi === m.id}>
                    {generatingAi === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {generatingAi === m.id ? "Generating..." : "AI Summary"}
                  </Button>
                  {aiResult && (
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground" onClick={() => setExpandedAi(isExpanded ? null : m.id)}>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {isExpanded ? "Hide" : "View Summary"}
                    </Button>
                  )}
                </div>

                {/* AI Summary Panel */}
                <AnimatePresence>
                  {aiResult && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-xl bg-accent/50 border border-border/60 p-4 space-y-3">
                        {/* Summary */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-primary" /> Summary
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">{aiResult.summary}</p>
                        </div>

                        {/* Action Items */}
                        {aiResult.actionItems && aiResult.actionItems.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Bell className="h-3 w-3 text-primary" /> Action Items
                            </p>
                            <div className="space-y-2">
                              {aiResult.actionItems.map((item, idx) => {
                                const reminderKey = `${m.id}-${item}`;
                                return (
                                  <div key={idx} className="flex items-center justify-between gap-3 rounded-lg bg-background/60 border border-border/40 px-3 py-2">
                                    <p className="text-sm text-foreground flex-1">{item}</p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 text-xs shrink-0 h-7"
                                      disabled={addingReminder === reminderKey}
                                      onClick={() => handleAddActionToReminder(m.id, item)}
                                    >
                                      {addingReminder === reminderKey
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <PlusCircle className="h-3 w-3" />}
                                      Add Reminder
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

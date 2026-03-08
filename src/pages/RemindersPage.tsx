import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Check, Pencil, Trash2, Clock, User, CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ContactSearchSelect } from "@/components/ContactSearchSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from "@/hooks/useReminders";
import { useContacts } from "@/hooks/useContacts";
import { useAuth } from "@/hooks/useAuth";
import { DbReminder } from "@/lib/api";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export default function RemindersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reminders = [], isLoading } = useReminders();
  const { data: contacts = [] } = useContacts();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<DbReminder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("10:00");

  const upcoming = reminders.filter((r) => !r.completed).sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());
  const completed = reminders.filter((r) => r.completed);

  // Notification check
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      upcoming.forEach((r) => {
        const rDate = new Date(r.reminder_date);
        const diff = rDate.getTime() - now.getTime();
        if (diff > 0 && diff < 60000) {
          toast({ title: "⏰ Reminder", description: `${r.title}: ${r.message}` });
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [upcoming, toast]);

  function resetForm() {
    setTitle("");
    setMessage("");
    setContactId(null);
    setDate(undefined);
    setTime("10:00");
    setEditingReminder(null);
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(r: DbReminder) {
    setEditingReminder(r);
    setTitle(r.title);
    setMessage(r.message || "");
    setContactId(r.contact_id || null);
    const d = new Date(r.reminder_date);
    setDate(d);
    setTime(format(d, "HH:mm"));
    setFormOpen(true);
  }

  async function handleSave() {
    if (!title || !date || !user) return;
    const [h, m] = time.split(":").map(Number);
    const reminderDate = new Date(date);
    reminderDate.setHours(h, m, 0, 0);

    try {
      if (editingReminder) {
        await updateReminder.mutateAsync({
          id: editingReminder.id,
          updates: {
            title,
            message,
            contact_id: contactId,
            reminder_date: reminderDate.toISOString(),
          },
        });
        toast({ title: "Reminder updated" });
      } else {
        await createReminder.mutateAsync({
          user_id: user.id,
          title,
          message,
          contact_id: contactId,
          reminder_date: reminderDate.toISOString(),
          completed: false,
        });
        toast({ title: "Reminder created" });
      }
      setFormOpen(false);
      resetForm();
    } catch {
      toast({ title: "Error saving reminder", variant: "destructive" });
    }
  }

  async function handleToggle(r: DbReminder) {
    await updateReminder.mutateAsync({ id: r.id, updates: { completed: !r.completed } });
    toast({ title: r.completed ? "Marked as upcoming" : "Marked as done" });
  }

  async function handleDelete() {
    if (!deletingId) return;
    await deleteReminder.mutateAsync(deletingId);
    setDeleteOpen(false);
    setDeletingId(null);
    toast({ title: "Reminder deleted" });
  }

  function getContactName(id: string | null) {
    if (!id) return null;
    return contacts.find((c) => c.id === id)?.name ?? null;
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reminders</h1>
          <p className="text-sm text-muted-foreground">{upcoming.length} upcoming · {completed.length} completed</p>
        </div>
      </div>

      {/* Empty state */}
      {reminders.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No reminders yet.</h2>
          <p className="text-muted-foreground mb-4">Stay on top of your follow-ups by creating reminders.</p>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Create your first reminder</Button>
        </motion.div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Upcoming</h2>
          <AnimatePresence>
            {upcoming.map((r, i) => {
              const contactName = getContactName(r.contact_id);
              const rDate = new Date(r.reminder_date);
              const overdue = isPast(rDate) && !isToday(rDate);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "bg-card rounded-xl border px-5 py-4 shadow-sm flex items-start justify-between gap-4",
                    overdue ? "border-destructive/40" : "border-primary/20"
                  )}
                >
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-semibold text-foreground">{r.title}</p>
                    {r.message && <p className="text-sm text-muted-foreground">{r.message}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(rDate, "MMM d, yyyy · h:mm a")}
                      </span>
                      {contactName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {contactName}
                        </span>
                      )}
                      {overdue && <span className="text-destructive font-medium">Overdue</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => handleToggle(r)} title="Mark as done">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setDeletingId(r.id); setDeleteOpen(true); }} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Completed</h2>
          {completed.map((r) => {
            const contactName = getContactName(r.contact_id);
            return (
              <div key={r.id} className="bg-card rounded-xl border border-border px-5 py-3 opacity-60 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm line-through text-foreground">{r.title}</p>
                  {contactName && <p className="text-xs text-muted-foreground">{contactName}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleToggle(r)} className="text-xs">Undo</Button>
                  <Button size="icon" variant="ghost" onClick={() => { setDeletingId(r.id); setDeleteOpen(true); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReminder ? "Edit Reminder" : "New Reminder"}</DialogTitle>
            <DialogDescription>
              {editingReminder ? "Update the reminder details." : "Set up a new reminder for a follow-up."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up with..." />
            </div>
            <div className="space-y-2">
              <Label>Related Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No contact</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reminder details..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!title || !date || createReminder.isPending || updateReminder.isPending}>
              {editingReminder ? "Update" : "Save Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this reminder?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

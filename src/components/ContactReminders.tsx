import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { Bell, Plus, Check, Pencil, Trash2, Clock, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from "@/hooks/useReminders";
import { useAuth } from "@/hooks/useAuth";
import { DbReminder } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ContactRemindersProps {
  contactId: string;
  contactName: string;
}

export function ContactReminders({ contactId, contactName }: ContactRemindersProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: allReminders = [] } = useReminders();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const reminders = allReminders.filter((r) => r.contact_id === contactId);
  const upcoming = reminders.filter((r) => !r.completed);
  const completed = reminders.filter((r) => r.completed);

  const [formOpen, setFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<DbReminder | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("10:00");

  function resetForm() {
    setTitle("");
    setMessage("");
    setDate(undefined);
    setTime("10:00");
    setEditingReminder(null);
  }

  function openCreate() {
    resetForm();
    setTitle(`Follow up with ${contactName}`);
    setFormOpen(true);
  }

  function openEdit(r: DbReminder) {
    setEditingReminder(r);
    setTitle(r.title);
    setMessage(r.message || "");
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
          updates: { title, message, reminder_date: reminderDate.toISOString() },
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
  }

  async function handleDelete(id: string) {
    await deleteReminder.mutateAsync(id);
    toast({ title: "Reminder deleted" });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Follow-Up Reminders
        </h3>
        <Button size="sm" variant="outline" onClick={openCreate} className="gap-1.5 text-xs">
          <Plus className="h-3 w-3" /> Add Follow-Up Reminder
        </Button>
      </div>

      {upcoming.length === 0 && completed.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">No reminders for this contact yet.</p>
      )}

      {upcoming.map((r) => {
        const rDate = new Date(r.reminder_date);
        const overdue = isPast(rDate) && !isToday(rDate);
        return (
          <div key={r.id} className={cn("rounded-lg border px-4 py-2.5 flex items-center justify-between gap-2", overdue ? "border-destructive/30" : "border-primary/20")}>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {format(rDate, "MMM d — h:mm a")}
                {overdue && <span className="text-destructive ml-1">Overdue</span>}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleToggle(r)}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          </div>
        );
      })}

      {completed.map((r) => (
        <div key={r.id} className="rounded-lg border border-border px-4 py-2 opacity-50 flex items-center justify-between">
          <p className="text-xs line-through text-foreground">{r.title}</p>
          <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => handleToggle(r)}>Undo</Button>
        </div>
      ))}

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReminder ? "Edit Reminder" : "New Follow-Up Reminder"}</DialogTitle>
            <DialogDescription>For {contactName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up with..." />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Details..." rows={2} />
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
            <Button onClick={handleSave} disabled={!title || !date}>
              {editingReminder ? "Update" : "Save Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

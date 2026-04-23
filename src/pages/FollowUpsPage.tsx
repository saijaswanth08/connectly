import { useState } from "react";
import { UpcomingRemindersWidget } from "@/components/UpcomingRemindersWidget";
import { useCreateReminder } from "@/hooks/useReminders";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function FollowUpsPage() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [contactId, setContactId] = useState("");
  const [message, setMessage] = useState("");

  const createReminder = useCreateReminder();
  const { data: contacts = [] } = useContacts();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !reminderDate) return;
    await createReminder.mutateAsync({
      user_id: "",           // filled server-side via RLS
      contact_id: contactId || null,
      title: title.trim(),
      message: message.trim(),
      reminder_date: reminderDate,
      completed: false,
    });
    setTitle("");
    setReminderDate("");
    setContactId("");
    setMessage("");
    setShowForm(false);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Upcoming Follow-Ups</h1>
        <p className="text-sm text-muted-foreground">View and manage your upcoming reminders and follow-up tasks.</p>
      </div>

      {/* Inline create form (shown when Create one is clicked) */}
      {showForm && (
        <div className="rounded-xl bg-card border border-border/50 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">New Follow-Up</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
              <Input
                placeholder="e.g. Follow up on project proposal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date &amp; Time *</label>
              <Input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact (optional)</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— None —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
              <Input
                placeholder="Any details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={createReminder.isPending}>
                {createReminder.isPending ? "Saving…" : "Save Follow-Up"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <UpcomingRemindersWidget onCreateClick={() => setShowForm(true)} />
    </div>
  );
}

import { useMemo } from "react";
import { useContacts } from "@/hooks/useContacts";
import { useTimelineEvents } from "@/hooks/useTimeline";
import { useCreateReminder } from "@/hooks/useReminders";
import { useAuth } from "@/hooks/useAuth";
import { Lightbulb, Bell, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { differenceInDays } from "date-fns";
import { Link } from "react-router-dom";

interface Suggestion {
  id: string;
  contactId: string;
  contactName: string;
  message: string;
  daysSince: number;
}

export function NetworkingInsightsWidget() {
  const { user } = useAuth();
  const { data: contacts = [] } = useContacts();
  const { data: events = [] } = useTimelineEvents();
  const createReminder = useCreateReminder();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = useMemo<Suggestion[]>(() => {
    const now = new Date();
    
    // Group events by contact_id for O(1) lookup
    const eventsByContact = new Map<string, typeof events>();
    events.forEach(event => {
      const list = eventsByContact.get(event.contact_id) || [];
      list.push(event);
      eventsByContact.set(event.contact_id, list);
    });

    return contacts
      .map((c) => {
        const contactEvents = eventsByContact.get(c.id) || [];
        const lastEvent = [...contactEvents].sort(
          (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        )[0];
        const lastDate = lastEvent ? new Date(lastEvent.event_date) : new Date(c.created_at);
        const daysSince = differenceInDays(now, lastDate);
        if (daysSince < 7) return null;
        return {
          id: c.id,
          contactId: c.id,
          contactName: c.name,
          message: `You haven't interacted with ${c.name} in ${daysSince} days`,
          daysSince,
        };
      })
      .filter((s): s is Suggestion => s !== null && !dismissed.has(s.id))
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 5);
  }, [contacts, events, dismissed]);

  const handleCreateReminder = async (s: Suggestion) => {
    if (!user) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    try {
      await createReminder.mutateAsync({
        user_id: user.id,
        title: `Follow up with ${s.contactName}`,
        message: `Reconnect — last interaction was ${s.daysSince} days ago`,
        contact_id: s.contactId,
        reminder_date: tomorrow.toISOString(),
        completed: false,
      });
      toast({ title: "Reminder created!" });
      setDismissed((prev) => new Set(prev).add(s.id));
    } catch {
      toast({ title: "Error creating reminder", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-accent-foreground" />
        </div>
        <h2 className="font-display font-semibold text-foreground">Networking Insights</h2>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          You're all caught up! No reconnection suggestions right now.
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <div key={s.id} className="flex items-start gap-3 group">
              <div className="h-2 w-2 rounded-full bg-chart-3 mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{s.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleCreateReminder(s)}
                    disabled={createReminder.isPending}
                  >
                    <Bell className="h-3 w-3" /> Create Reminder
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" asChild>
                    <Link to={`/dashboard/contacts/${s.contactId}`}>
                      <Calendar className="h-3 w-3" /> View Contact
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDismissed((prev) => new Set(prev).add(s.id))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useReminders } from "@/hooks/useReminders";
import { useContacts } from "@/hooks/useContacts";
import { format, isPast, isToday } from "date-fns";
import { Bell, Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function UpcomingRemindersWidget({ onCreateClick }: { onCreateClick?: () => void } = {}) {
  const { data: reminders = [] } = useReminders();
  const { data: contacts = [] } = useContacts();

  const upcoming = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
    .slice(0, 3);

  const getContactName = (id: string | null) => {
    if (!id) return null;
    return contacts.find((c) => c.id === id)?.name ?? null;
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <Bell className="h-4 w-4 text-accent-foreground" />
          </div>
          <h2 className="font-display font-semibold text-foreground">Upcoming Follow-Ups</h2>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
          <Link to="/dashboard/reminders">View All <ArrowRight className="h-3 w-3" /></Link>
        </Button>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No upcoming reminders</p>
          {onCreateClick ? (
            <Button variant="link" size="sm" className="mt-1" onClick={onCreateClick}>
              Create one
            </Button>
          ) : (
            <Button variant="link" size="sm" asChild className="mt-1">
              <Link to="/dashboard/reminders">Create one</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((r) => {
            const rDate = new Date(r.reminder_date);
            const overdue = isPast(rDate) && !isToday(rDate);
            const contactName = getContactName(r.contact_id);
            return (
              <div
                key={r.id}
                className={cn(
                  "rounded-lg border px-4 py-3 space-y-0.5",
                  overdue ? "border-destructive/30 bg-destructive/5" : "border-border/50"
                )}
              >
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(rDate, "MMM d · h:mm a")}
                  </span>
                  {contactName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {contactName}
                    </span>
                  )}
                  {overdue && <span className="text-destructive font-medium">Overdue</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

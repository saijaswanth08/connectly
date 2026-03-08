import { useState } from "react";
import { Bell, Check, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReminders, useUpdateReminder } from "@/hooks/useReminders";
import { useContacts } from "@/hooks/useContacts";
import { format, isPast, isToday } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data: reminders = [] } = useReminders();
  const { data: contacts = [] } = useContacts();
  const updateReminder = useUpdateReminder();
  const [open, setOpen] = useState(false);

  const pending = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());

  const overdue = pending.filter((r) => {
    const d = new Date(r.reminder_date);
    return isPast(d) && !isToday(d);
  });

  const count = pending.length;
  const getContactName = (id: string | null) => contacts.find((c) => c.id === id)?.name ?? null;

  async function markDone(id: string) {
    await updateReminder.mutateAsync({ id, updates: { completed: true } });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h3 className="font-display font-semibold text-sm text-foreground">Notifications</h3>
          <p className="text-xs text-muted-foreground">{count} upcoming · {overdue.length} overdue</p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending reminders</p>
          ) : (
            pending.slice(0, 8).map((r) => {
              const rDate = new Date(r.reminder_date);
              const isOverdue = isPast(rDate) && !isToday(rDate);
              const contactName = getContactName(r.contact_id);
              return (
                <div key={r.id} className={cn("px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/50", isOverdue && "bg-destructive/5")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{format(rDate, "MMM d, h:mm a")}</span>
                        {contactName && <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{contactName}</span>}
                        {isOverdue && <span className="text-destructive font-medium">Overdue</span>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => markDone(r.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                  {r.contact_id && (
                    <Link
                      to={`/dashboard/contacts/${r.contact_id}`}
                      className="text-[11px] text-primary hover:underline mt-1 inline-block"
                      onClick={() => setOpen(false)}
                    >
                      Open Contact
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
        {count > 0 && (
          <div className="p-2 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild onClick={() => setOpen(false)}>
              <Link to="/dashboard/reminders">View All Reminders</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

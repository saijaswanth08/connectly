import { useState } from "react";
import { Bell, Check, User, Clock, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReminders, useUpdateReminder } from "@/hooks/useReminders";
import { useMessageRequests, useHandleMessageRequest } from "@/hooks/useMessages";
import { useContacts } from "@/hooks/useContacts";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isToday } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data: reminders = [] } = useReminders();
  const { data: messageRequests = [] } = useMessageRequests();
  const { data: contacts = [] } = useContacts();
  const updateReminder = useUpdateReminder();
  const handleRequest = useHandleMessageRequest();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const pendingRequests = messageRequests;

  const pending = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());

  const overdue = pending.filter((r) => {
    const d = new Date(r.reminder_date);
    return isPast(d) && !isToday(d);
  });

  const count = pending.length + pendingRequests.length;
  const getContactName = (id: string | null) => contacts.find((c) => c.id === id)?.name ?? null;

  async function markDone(id: string) {
    await updateReminder.mutateAsync({ id, updates: { completed: true } });
  }

  async function respondToRequest(id: string, action: 'accept' | 'reject') {
    try {
      await handleRequest.mutateAsync({ requestId: id, action });
      toast({
        title: action === 'accept' ? "Request accepted" : "Request declined",
        description: action === 'accept' ? "You can now chat with them in Messages." : "The message request was removed.",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
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
          <p className="text-xs text-muted-foreground">
            {pendingRequests.length} requests · {pending.length} reminders
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {count === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No new notifications</p>
          )}

          {/* Message Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Message Requests
              </div>
              {pendingRequests.map((req) => (
                <div key={req.id} className="px-3 py-2.5 border-b border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{req.sender_name}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />Wants to connect</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate italic">"{req.content}"</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100" onClick={() => respondToRequest(req.id, 'accept')}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => respondToRequest(req.id, 'reject')}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reminders Section */}
          {pending.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Reminders
              </div>
            {pending.slice(0, 8).map((r) => {
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
            })}
            </div>
          )}
        </div>
        {pending.length > 0 && (
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

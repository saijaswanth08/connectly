import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Bell, Check, User, Clock, MessageSquare, X, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReminders, useUpdateReminder } from "@/hooks/useReminders";
import { useMessageRequests, useHandleMessageRequest } from "@/hooks/useMessages";
import { useContacts } from "@/hooks/useContacts";
import { useIncomingContactRequests, useOutgoingAcceptedRequests, useAcceptContactRequest, useDeclineContactRequest, useAddContactFromAccepted } from "@/hooks/useContactRequests";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isToday } from "date-fns";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const location = useLocation();
  const { data: reminders = [] } = useReminders();
  const { data: messageRequests = [] } = useMessageRequests();
  const { data: contacts = [] } = useContacts();
  const { data: incomingContactReqs = [] } = useIncomingContactRequests();
  const { data: acceptedOutgoing = [] } = useOutgoingAcceptedRequests();

  const updateReminder = useUpdateReminder();
  const handleMsgRequest = useHandleMessageRequest();
  const acceptContactReq = useAcceptContactRequest();
  const declineContactReq = useDeclineContactRequest();
  const addFromAccepted = useAddContactFromAccepted();

  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // 1. Fetch latest incoming contact messages
  const { data: incomingMessages = [], refetch: refetchIncoming } = useQuery({
    queryKey: ["notification-messages"],
    queryFn: async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, contact_id");
      
      if (!convs || convs.length === 0) return [];
      
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_type", "contact")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("[NotificationBell] Error fetching messages:", error.message);
        throw error;
      }
      
      return (msgs || []).map((m) => ({
        ...m,
        contact_id: convs.find((c) => c.id === m.conversation_id)?.contact_id || null,
      }));
    },
  });

  // 2. Subscribe to real-time incoming messages
  useEffect(() => {
    const channel = supabase
      .channel("notification-bell-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "sender_type=eq.contact",
        },
        () => {
          refetchIncoming();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchIncoming]);

  // 3. Read/unread state using localStorage
  const [readMessageIds, setReadMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("connectly-read-messages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markMessageAsRead = (id: string) => {
    setReadMessageIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem("connectly-read-messages", JSON.stringify(next));
      return next;
    });
  };

  // 4. Auto-read messages if chatting with this contact
  const activeContactId = new URLSearchParams(location.search).get("contactId");
  const isMessagesPage = location.pathname === "/dashboard/messages";

  const unreadMessages = incomingMessages.filter((m) => {
    const isReadLocally = readMessageIds.includes(m.id);
    const isCurrentlyChatting = isMessagesPage && m.contact_id === activeContactId;

    if (isCurrentlyChatting && !isReadLocally) {
      setTimeout(() => markMessageAsRead(m.id), 0);
      return false;
    }

    return !isReadLocally && !isCurrentlyChatting;
  });

  const pending = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());

  const count = pending.length + messageRequests.length + incomingContactReqs.length + acceptedOutgoing.length + unreadMessages.length;
  const getContactName = (id: string | null) => contacts.find((c) => c.id === id)?.name ?? null;

  async function markDone(id: string) {
    await updateReminder.mutateAsync({ id, updates: { completed: true } });
  }

  async function respondToMsgRequest(id: string, action: 'accept' | 'reject') {
    try {
      await handleMsgRequest.mutateAsync({ requestId: id, action });
      toast({ title: action === 'accept' ? "Request accepted" : "Request declined" });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleAcceptContact(requestId: string, fromUserId: string, name: string) {
    try {
      await acceptContactReq.mutateAsync({ requestId, fromUserId });
      toast({ title: "Contact added!", description: `${name} is now in your contacts.` });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleDeclineContact(requestId: string) {
    try {
      await declineContactReq.mutateAsync(requestId);
      toast({ title: "Request declined" });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleAddAccepted(requestId: string, toUserId: string, name: string) {
    try {
      await addFromAccepted.mutateAsync({ requestId, toUserId });
      toast({ title: "Contact added!", description: `${name} is now in your contacts.` });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
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
            {incomingContactReqs.length} contact requests · {messageRequests.length + unreadMessages.length} messages · {pending.length} reminders
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No new notifications</p>
          )}

          {/* Incoming Contact Requests */}
          {incomingContactReqs.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contact Requests
              </div>
              {incomingContactReqs.map((req) => {
                const name = req.from_profile?.name ?? 'Someone';
                const sub = req.from_profile?.job_title && req.from_profile?.company
                  ? `${req.from_profile.job_title} at ${req.from_profile.company}`
                  : req.from_profile?.email ?? '';
                return (
                  <div key={req.id} className="px-3 py-2.5 border-b border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <UserPlus className="h-2.5 w-2.5" />
                          <span>Wants to add you as a contact</span>
                        </div>
                        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                          onClick={() => handleAcceptContact(req.id, req.from_user_id, name)}
                          disabled={acceptContactReq.isPending}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeclineContact(req.id)}
                          disabled={declineContactReq.isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Outgoing Accepted — notify requester to add back */}
          {acceptedOutgoing.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Requests Accepted
              </div>
              {acceptedOutgoing.map((req) => {
                const name = req.to_profile?.name ?? 'Someone';
                return (
                  <div key={req.id} className="px-3 py-2.5 border-b border-border/50 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{name} accepted your request!</p>
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-0.5">
                          <UserCheck className="h-2.5 w-2.5" />
                          <span>Tap to add them to your contacts</span>
                        </div>
                      </div>
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleAddAccepted(req.id, req.to_user_id, name)}
                        disabled={addFromAccepted.isPending}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Message Requests */}
          {messageRequests.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Message Requests
              </div>
              {messageRequests.map((req) => (
                <div key={req.id} className="px-3 py-2.5 border-b border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{req.sender_name}</p>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <MessageSquare className="h-2.5 w-2.5" />
                        <span>Wants to connect</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate italic">"{req.content}"</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100" onClick={() => respondToMsgRequest(req.id, 'accept')}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => respondToMsgRequest(req.id, 'reject')}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Chat Messages */}
          {unreadMessages.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                New Messages
              </div>
              {unreadMessages.map((m) => {
                const name = getContactName(m.contact_id) || "Someone";
                return (
                  <div key={m.id} className="px-3 py-2.5 border-b border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <Link 
                        to={`/dashboard/messages?contactId=${m.contact_id}`} 
                        className="min-w-0 flex-1 hover:underline"
                        onClick={() => {
                          setOpen(false);
                          markMessageAsRead(m.id);
                        }}
                      >
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <MessageSquare className="h-2.5 w-2.5" />
                          <span className="truncate">{m.content}</span>
                        </div>
                      </Link>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 shrink-0" 
                        onClick={() => markMessageAsRead(m.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reminders */}
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
                      <Link to={`/dashboard/contacts/${r.contact_id}`} className="text-[11px] text-primary hover:underline mt-1 inline-block" onClick={() => setOpen(false)}>
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

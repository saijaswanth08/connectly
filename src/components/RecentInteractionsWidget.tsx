import { useTimelineEvents } from "@/hooks/useTimeline";
import { useContacts } from "@/hooks/useContacts";
import { format } from "date-fns";
import { Video, Phone, FileText, RefreshCw, Bell, MessageSquare, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const iconMap: Record<string, React.ElementType> = {
  meeting: Video,
  call: Phone,
  note: FileText,
  follow_up: RefreshCw,
  reminder: Bell,
  message: MessageSquare,
  contact_added: UserPlus,
};

export function RecentInteractionsWidget() {
  const { data: events = [], isError } = useTimelineEvents();
  const { data: contacts = [] } = useContacts();

  const recent = events.slice(0, 5);
  const getContactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="rounded-xl bg-card border border-border/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-foreground">Recent Interactions</h2>
      </div>

      {(recent.length === 0 || isError) ? (
        <p className="text-sm text-muted-foreground text-center py-4">No interactions yet</p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((e) => {
            const Icon = iconMap[e.event_type] || FileText;
            return (
              <Link key={e.id} to={`/dashboard/contacts/${e.contact_id}`} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
                <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground">{getContactName(e.contact_id)} · {format(new Date(e.event_date), "MMM d")}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

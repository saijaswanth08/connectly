import { useTimelineEvents } from "@/hooks/useTimeline";
import { useContacts, useMeetings } from "@/hooks/useContacts";
import { format } from "date-fns";
import { Video, Phone, FileText, RefreshCw, Bell, MessageSquare, UserPlus, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const iconMap: Record<string, React.ElementType> = {
  meeting: Video,
  video_call: Video,
  call: Phone,
  phone_call: Phone,
  note: FileText,
  follow_up: RefreshCw,
  reminder: Bell,
  message: MessageSquare,
  contact_added: UserPlus,
  conference: Calendar,
  networking_event: Calendar,
};

interface FeedItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  icon: React.ElementType;
  href: string;
}

export function RecentInteractionsWidget() {
  const { data: events = [] } = useTimelineEvents();
  const { data: contacts = [] } = useContacts();
  const { data: meetings = [] } = useMeetings();

  const getContactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? "Unknown";

  // Build a merged feed from timeline events, contacts, and meetings
  const feed: FeedItem[] = [];

  // 1. Timeline events (highest fidelity)
  events.slice(0, 10).forEach((e) => {
    feed.push({
      id: `evt-${e.id}`,
      title: e.title,
      subtitle: `${getContactName(e.contact_id)} · ${format(new Date(e.event_date), "MMM d")}`,
      date: e.event_date,
      icon: iconMap[e.event_type] || FileText,
      href: `/dashboard/contacts/${e.contact_id}`,
    });
  });

  // 2. Fallback: recent contacts (if timeline is empty)
  if (feed.length === 0) {
    contacts.slice(0, 5).forEach((c) => {
      feed.push({
        id: `contact-${c.id}`,
        title: `Added ${c.name}`,
        subtitle: `${c.company || "Contact"} · ${format(new Date(c.created_at), "MMM d")}`,
        date: c.created_at,
        icon: UserPlus,
        href: `/dashboard/contacts/${c.id}`,
      });
    });

    // 3. Fallback: recent meetings
    meetings.slice(0, 3).forEach((m) => {
      feed.push({
        id: `meeting-${m.id}`,
        title: m.title,
        subtitle: `${m.meeting_type.replace(/_/g, " ")} · ${m.meeting_time ? format(new Date(m.meeting_time), "MMM d") : "—"}`,
        date: m.meeting_time || m.created_at,
        icon: Video,
        href: `/dashboard/interactions`,
      });
    });
  }

  // Sort by date descending and take top 5
  const recent = feed
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-xl bg-card border border-border/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-foreground">Recent Interactions</h2>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No interactions yet</p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.href}
                className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";

interface Props {
  contactId: string;
}

export function RelationshipStrength({ contactId }: Props) {
  const { user } = useAuth();

  const { data: strength = 0 } = useQuery({
    queryKey: ["relationship-strength", contactId],
    queryFn: async () => {
      if (!user?.id) return 0;

      const [meetings, timeline, reminders] = await Promise.all([
        supabase
          .from("meetings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("contact_id", contactId),
        supabase
          .from("timeline_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("contact_id", contactId),
        supabase
          .from("reminders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("contact_id", contactId)
          .eq("completed", true),
      ]);

      const meetingCount = meetings.count || 0;
      const timelineCount = timeline.count || 0;
      const reminderCount = reminders.count || 0;

      // Score: meetings worth 20pts each, timeline events 10pts, completed reminders 15pts, cap at 100
      const raw = meetingCount * 20 + timelineCount * 10 + reminderCount * 15;
      return Math.min(100, raw);
    },
    enabled: !!user?.id && !!contactId,
    staleTime: 5 * 60 * 1000,
  });

  const getColor = (val: number) => {
    if (val >= 70) return "text-green-500";
    if (val >= 40) return "text-yellow-500";
    return "text-muted-foreground";
  };

  return (
    <section className="space-y-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5" /> Relationship Strength
      </h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Progress value={strength} className="flex-1 h-2" />
          <span className={`ml-3 text-sm font-bold tabular-nums ${getColor(strength)}`}>
            {strength}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {strength >= 70
            ? "Strong relationship — keep it up!"
            : strength >= 40
            ? "Growing connection — schedule a follow-up"
            : "New connection — reach out to strengthen it"}
        </p>
      </div>
    </section>
  );
}

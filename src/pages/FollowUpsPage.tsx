import { UpcomingRemindersWidget } from "@/components/UpcomingRemindersWidget";

export default function FollowUpsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Upcoming Follow-Ups</h1>
        <p className="text-sm text-muted-foreground">View and manage your upcoming reminders and follow-up tasks.</p>
      </div>
      <UpcomingRemindersWidget />
    </div>
  );
}

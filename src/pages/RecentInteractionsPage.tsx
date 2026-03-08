import { RecentInteractionsWidget } from "@/components/RecentInteractionsWidget";

export default function RecentInteractionsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Recent Interactions</h1>
        <p className="text-sm text-muted-foreground">Review your latest professional interactions and meetings.</p>
      </div>
      <RecentInteractionsWidget />
    </div>
  );
}

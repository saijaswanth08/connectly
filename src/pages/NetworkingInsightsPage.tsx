import { NetworkingInsightsWidget } from "@/components/NetworkingInsightsWidget";

export default function NetworkingInsightsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Networking Insights</h1>
        <p className="text-sm text-muted-foreground">Analyze your networking patterns and connection strengths.</p>
      </div>
      <NetworkingInsightsWidget />
    </div>
  );
}

import { RecentInteractionsWidget } from "@/components/RecentInteractionsWidget";
import { NetworkingInsightsWidget } from "@/components/NetworkingInsightsWidget";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function RecentInteractionsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">Recent Interactions</h1>
      </div>
      <RecentInteractionsWidget />
      <NetworkingInsightsWidget />
    </div>
  );
}

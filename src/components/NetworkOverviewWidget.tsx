import { useContacts } from "@/hooks/useContacts";
import { useContactConnections } from "@/hooks/useConnections";
import { Network, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TAG_COLORS: Record<string, string> = {
  investor: "#8b5cf6", client: "#22c55e", mentor: "#f59e0b",
  partner: "#3b82f6", recruiter: "#ec4899", friend: "#06b6d4",
};

function getColor(tags: string[]): string {
  for (const t of tags) if (TAG_COLORS[t.toLowerCase()]) return TAG_COLORS[t.toLowerCase()];
  return "#6477b8";
}

export function NetworkOverviewWidget() {
  const { data: contacts = [] } = useContacts();
  const { data: connections = [] } = useContactConnections();

  const preview = contacts.slice(0, 5);

  return (
    <div className="rounded-xl bg-card border border-border/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <Network className="h-4 w-4 text-accent-foreground" />
          </div>
          <h2 className="font-display font-semibold text-foreground">Network Overview</h2>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
          <Link to="/dashboard/network">Open Full Network Map <ArrowRight className="h-3 w-3" /></Link>
        </Button>
      </div>

      {preview.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No contacts yet</p>
      ) : (
        <div className="flex items-center justify-center py-4">
          {/* Mini node visualization */}
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Lines between first few nodes */}
            {preview.length > 1 && preview.slice(1).map((_, i) => {
              const angle1 = (2 * Math.PI * 0) / preview.length;
              const angle2 = (2 * Math.PI * (i + 1)) / preview.length;
              const cx = 100, cy = 60, r = 40;
              const x1 = cx + Math.cos(angle1) * r;
              const y1 = cy + Math.sin(angle1) * r;
              const x2 = cx + Math.cos(angle2) * r;
              const y2 = cy + Math.sin(angle2) * r;
              return (
                <line
                  key={i}
                  x1={x1 ?? 0}
                  y1={y1 ?? 0}
                  x2={x2 ?? 0}
                  y2={y2 ?? 0}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  opacity="0.5"
                />
              );
            })}
            {preview.map((c, i) => {
              const angle = (2 * Math.PI * i) / preview.length;
              const cx = 100 + Math.cos(angle) * 40;
              const cy = 60 + Math.sin(angle) * 40;
              const color = getColor(c.tags || []);
              const initials = (c.name || "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <g key={c.id}>
                  <circle cx={cx ?? 0} cy={cy ?? 60} r="16" fill={color} opacity="0.9" />
                  <text x={cx ?? 0} y={(cy ?? 60) + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="bold">{initials}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{contacts.length} contacts</span>
        <span>{connections.length} connections</span>
      </div>
    </div>
  );
}

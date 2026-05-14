import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "glow";
  accentColor?: "primary" | "yellow" | "purple" | "green";
}

const colorMap = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  yellow: {
    bg: "bg-yellow-400/10",
    text: "text-yellow-500",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-500",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-500",
  },
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = "default", accentColor = "primary" }: MetricCardProps) {
  const colors = colorMap[accentColor];

  return (
    <div className={`glass-card rounded-xl p-5 ${variant === 'glow' ? 'glow-emerald' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-display font-bold tracking-tight">{value}</p>
          {trend ? (
            <p className="text-xs text-primary font-medium">{trend}</p>
          ) : subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}


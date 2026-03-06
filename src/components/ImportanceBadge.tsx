import { ImportanceLevel } from "@/lib/types";
import { Star } from "lucide-react";

const config: Record<ImportanceLevel, { label: string; className: string }> = {
  vip: { label: "VIP", className: "bg-vip/15 text-vip border-vip/30" },
  high: { label: "High", className: "bg-high/15 text-high border-high/30" },
  medium: { label: "Medium", className: "bg-medium/15 text-medium border-medium/30" },
  low: { label: "Low", className: "bg-low/15 text-low border-low/30" },
};

export function ImportanceBadge({ level }: { level: ImportanceLevel }) {
  const { label, className } = config[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {level === "vip" && <Star className="h-3 w-3 fill-current" />}
      {label}
    </span>
  );
}

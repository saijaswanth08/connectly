import { ContactTag } from "@/lib/types";

const tagColors: Record<ContactTag, string> = {
  investor: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  client: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  mentor: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  partner: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  recruiter: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  friend: "bg-primary/15 text-primary border-primary/30",
};

export function TagBadge({ tag }: { tag: ContactTag }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${tagColors[tag]}`}>
      {tag}
    </span>
  );
}

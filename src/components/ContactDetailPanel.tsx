import { DbContact } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Building2, MapPin, Linkedin, Pencil, CalendarPlus, Trash2, Star, StickyNote, Clock } from "lucide-react";
import { RelationshipStrength } from "@/components/RelationshipStrength";

const importanceConfig: Record<string, { label: string; class: string }> = {
  vip: { label: "VIP", class: "bg-vip/20 text-vip border-vip/30" },
  high: { label: "High", class: "bg-high/20 text-high border-high/30" },
  medium: { label: "Medium", class: "bg-medium/20 text-medium border-medium/30" },
  low: { label: "Low", class: "bg-low/20 text-low border-low/30" },
};

interface ContactDetailPanelProps {
  contact: DbContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (contact: DbContact) => void;
  onDelete?: (id: string) => void;
  onScheduleMeeting?: (contact: DbContact) => void;
}

export function ContactDetailPanel({ contact, open, onOpenChange, onEdit, onDelete, onScheduleMeeting }: ContactDetailPanelProps) {
  if (!contact) return null;

  const initials = contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const imp = importanceConfig[contact.importance] || importanceConfig.medium;

  const timeline = [
    { date: new Date(contact.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), label: "Contact added", icon: Star },
    ...(contact.meeting_location ? [{ date: contact.meeting_date ? new Date(contact.meeting_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—", label: `Met at ${contact.meeting_location}`, icon: MapPin }] : []),
    ...(contact.linkedin_url ? [{ date: "—", label: "LinkedIn connected", icon: Linkedin }] : []),
    ...(contact.notes ? [{ date: "—", label: "Note added", icon: StickyNote }] : []),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/8 via-accent/20 to-background px-6 pt-6 pb-5">
          <SheetHeader className="space-y-0">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shrink-0 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/15 text-primary font-display font-bold text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="font-display text-xl font-bold text-foreground">{contact.name}</SheetTitle>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${imp.class}`}>{imp.label}</span>
                </div>
                {(contact.job_title || contact.company) && (
                  <p className="text-sm text-muted-foreground">{contact.job_title}{contact.job_title && contact.company ? " at " : ""}{contact.company}</p>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs bg-card/80" onClick={() => onEdit?.(contact)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs bg-card/80" onClick={() => onScheduleMeeting?.(contact)}>
              <CalendarPlus className="h-3 w-3" /> Meeting
            </Button>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 bg-card/80" onClick={() => { onDelete?.(contact.id); onOpenChange(false); }}>
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Contact Info */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Contact Information</h4>
            <div className="space-y-2">
              {contact.email && <InfoRow icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />}
              {contact.phone && <InfoRow icon={Phone} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />}
              {contact.company && <InfoRow icon={Building2} label="Company" value={contact.company} />}
              {contact.meeting_location && <InfoRow icon={MapPin} label="Met at" value={contact.meeting_location} />}
              {contact.linkedin_url && (
                <InfoRow icon={Linkedin} label="LinkedIn" value="View Profile" href={contact.linkedin_url.startsWith("http") ? contact.linkedin_url : `https://${contact.linkedin_url}`} external />
              )}
            </div>
          </section>

          <Separator />

          {/* Relationship Strength */}
          <RelationshipStrength contactId={contact.id} />

          <Separator />

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <>
              <section className="space-y-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium bg-accent text-accent-foreground border-0">{tag}</Badge>
                  ))}
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Notes */}
          {contact.notes && (
            <>
              <section className="space-y-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5" /> Notes
                </h4>
                <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Timeline */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Timeline
            </h4>
            <div className="relative pl-5 space-y-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {timeline.map((entry, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  <div className="absolute -left-5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card border border-border">
                    <entry.icon className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{entry.label}</p>
                    <p className="text-[11px] text-muted-foreground">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ icon: Icon, label, value, href, external }: { icon: React.ElementType; label: string; value: string; href?: string; external?: boolean }) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg hover:bg-muted/50 px-3 py-2 -mx-3 transition-colors">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block">
        {content}
      </a>
    );
  }
  return content;
}

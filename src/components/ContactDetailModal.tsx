import { DbContact } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building2, MapPin, Linkedin, Pencil, CalendarPlus, Trash2, Star, StickyNote } from "lucide-react";
import { motion } from "framer-motion";

const importanceConfig: Record<string, { label: string; class: string }> = {
  vip: { label: "VIP", class: "bg-vip/20 text-vip border-vip/30" },
  high: { label: "High", class: "bg-high/20 text-high border-high/30" },
  medium: { label: "Medium", class: "bg-medium/20 text-medium border-medium/30" },
  low: { label: "Low", class: "bg-low/20 text-low border-low/30" },
};

interface ContactDetailModalProps {
  contact: DbContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (contact: DbContact) => void;
  onDelete?: (id: string) => void;
  onScheduleMeeting?: (contact: DbContact) => void;
}

export function ContactDetailModal({ contact, open, onOpenChange, onEdit, onDelete, onScheduleMeeting }: ContactDetailModalProps) {
  if (!contact) return null;

  const initials = contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const imp = importanceConfig[contact.importance] || importanceConfig.medium;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden rounded-2xl border-border/50 backdrop-blur-sm gap-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-accent/30 to-background px-6 pt-6 pb-5">
          <DialogHeader className="space-y-0">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shrink-0 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/15 text-primary font-display font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <DialogTitle className="font-display text-xl font-bold text-foreground">
                    {contact.name}
                  </DialogTitle>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${imp.class}`}>
                    {imp.label}
                  </span>
                </div>
                {(contact.job_title || contact.company) && (
                  <p className="text-sm text-muted-foreground">
                    {contact.job_title}{contact.job_title && contact.company ? " at " : ""}{contact.company}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Contact Info Grid */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contact.email && (
                <InfoRow icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
              )}
              {contact.phone && (
                <InfoRow icon={Phone} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
              )}
              {contact.company && (
                <InfoRow icon={Building2} label="Company" value={contact.company} />
              )}
              {contact.meeting_location && (
                <InfoRow icon={MapPin} label="Met at" value={contact.meeting_location} />
              )}
              {contact.linkedin_url && (
                <InfoRow
                  icon={Linkedin}
                  label="LinkedIn"
                  value="View Profile"
                  href={contact.linkedin_url.startsWith("http") ? contact.linkedin_url : `https://${contact.linkedin_url}`}
                  external
                />
              )}
            </div>
          </section>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium bg-accent text-accent-foreground border-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {contact.notes && (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5" /> Notes
              </h4>
              <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/30 flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => onEdit?.(contact)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => onScheduleMeeting?.(contact)}>
            <CalendarPlus className="h-3.5 w-3.5" /> Schedule Meeting
          </Button>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => { onDelete?.(contact.id); onOpenChange(false); }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value, href, external }: { icon: React.ElementType; label: string; value: string; href?: string; external?: boolean }) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 border border-border/40 px-3 py-2.5">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }
  return content;
}

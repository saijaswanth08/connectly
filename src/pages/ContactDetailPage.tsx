import { useParams, Link } from "react-router-dom";
import { useContactsStore } from "@/lib/contacts-store";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { TagBadge } from "@/components/TagBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactDetailPage() {
  const { id } = useParams();
  const contacts = useContactsStore((s) => s.contacts);
  const meetings = useContactsStore((s) => s.meetings);
  const timeline = useContactsStore((s) => s.timeline);

  const contact = contacts.find((c) => c.id === id);
  if (!contact) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Contact not found</p>
        <Link to="/contacts" className="text-primary hover:underline text-sm">← Back to contacts</Link>
      </div>
    );
  }

  const contactMeetings = meetings.filter((m) => m.contactId === id);
  const contactTimeline = timeline.filter((t) => t.contactId === id).sort((a, b) => b.date.localeCompare(a.date));
  const initials = contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link to="/contacts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to contacts
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-5">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary font-display font-bold text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-bold">{contact.name}</h1>
              <ImportanceBadge level={contact.importance} />
            </div>
            <div className="flex flex-wrap gap-1.5">{contact.tags.map((t) => <TagBadge key={t} tag={t} />)}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />{contact.company}</div>
              <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" />{contact.jobTitle}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{contact.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{contact.phone}</div>
            </div>
          </div>
        </div>
        {contact.notes && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground"><MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />{contact.notes}</p>
          </div>
        )}
      </motion.div>

      {contactMeetings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold">Meetings</h2>
          {contactMeetings.map((m) => (
            <div key={m.id} className="border-l-2 border-primary/30 pl-4 space-y-1">
              <p className="text-sm font-medium">{m.eventName}</p>
              <p className="text-xs text-muted-foreground">{m.dateMet} · {m.location} · {m.meetingType}</p>
              <p className="text-sm text-muted-foreground">{m.topic}</p>
              {m.opportunityNotes && <p className="text-xs text-primary">{m.opportunityNotes}</p>}
            </div>
          ))}
        </motion.div>
      )}

      {contactTimeline.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold">Timeline</h2>
          <div className="space-y-3">
            {contactTimeline.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-sm">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

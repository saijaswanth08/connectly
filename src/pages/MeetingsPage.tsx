import { useContactsStore } from "@/lib/contacts-store";
import { motion } from "framer-motion";
import { Calendar, MapPin, MessageSquare } from "lucide-react";

export default function MeetingsPage() {
  const meetings = useContactsStore((s) => s.meetings);
  const contacts = useContactsStore((s) => s.contacts);

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Meetings</h1>
        <p className="text-sm text-muted-foreground">{meetings.length} recorded meetings</p>
      </div>

      <div className="space-y-3">
        {meetings.map((m, i) => {
          const contact = contacts.find((c) => c.id === m.contactId);
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold">{m.eventName}</h3>
                  <p className="text-sm text-muted-foreground">with {contact?.name || "Unknown"}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                  {m.meetingType}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{m.dateMet}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>
              </div>
              <p className="text-sm"><MessageSquare className="h-3.5 w-3.5 inline mr-1" />{m.topic}</p>
              {m.opportunityNotes && (
                <p className="text-xs text-primary bg-primary/5 rounded-md px-3 py-1.5">{m.opportunityNotes}</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useContactsStore } from "@/lib/contacts-store";
import { useAuth } from "@/hooks/useAuth";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, Building2, Briefcase, MessageSquare, Linkedin, Instagram } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const contacts = useContactsStore((s) => s.contacts);
  const fetchContacts = useContactsStore((s) => s.fetchContacts);

  useEffect(() => {
    if (user?.id && contacts.length === 0) {
      fetchContacts(user.id);
    }
  }, [user?.id]);

  const contact = contacts.find((c) => c.id === id);
  if (!contact) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Contact not found</p>
        <Link to="/contacts" className="text-primary hover:underline text-sm">← Back to contacts</Link>
      </div>
    );
  }

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
              <ImportanceBadge level={contact.priority} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />{contact.company}</div>
              <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" />{contact.job_title}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{contact.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{contact.phone}</div>
              {contact.linkedin && (
                <div className="flex items-center gap-2"><Linkedin className="h-4 w-4" />{contact.linkedin}</div>
              )}
              {contact.instagram && (
                <div className="flex items-center gap-2"><Instagram className="h-4 w-4" />{contact.instagram}</div>
              )}
            </div>
          </div>
        </div>
        {contact.notes && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground"><MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />{contact.notes}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

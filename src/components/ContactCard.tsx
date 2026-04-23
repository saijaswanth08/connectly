import { DbContact } from "@/lib/api";
import { ImportanceBadge } from "./ImportanceBadge";

import { Building2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ContactCard({ contact, index = 0 }: { contact: DbContact; index?: number }) {
  const initials = contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/contacts/${contact.id}`}
        className="glass-card rounded-xl p-4 block hover:border-primary/30 transition-all duration-200 hover:shadow-md group dark:bg-slate-800 dark:border-slate-700"
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {contact.name}
              </h3>
              <ImportanceBadge level={contact.priority || "medium"} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.job_title} at {contact.company}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Users, Star, Bell, Calendar, ArrowLeft, Phone, Mail, Building2 } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { TagBadge } from "@/components/TagBadge";
import { useReminders } from "@/hooks/useReminders";
import { useMeetings, useContacts } from "@/hooks/useContacts";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DbContact, DbReminder, DbMeeting } from "@/lib/api";

// ────────────────────────────────────────────────────────────
// Inline Contact Detail View (no routing, no modal)
// ────────────────────────────────────────────────────────────
function ContactDetailView({
  contact,
  onBack,
}: {
  contact: DbContact;
  onBack: () => void;
}) {
  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Contact header card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-5">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-display font-bold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-display font-bold">{contact.name}</h2>
              <ImportanceBadge level={contact.priority} />
            </div>
            <p className="text-sm text-muted-foreground">
              {contact.job_title}
              {contact.company ? ` · ${contact.company}` : ""}
            </p>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <span>{contact.company}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className="mt-5 pt-5 border-t border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Notes
            </p>
            <p className="text-sm text-foreground leading-relaxed">{contact.notes}</p>
          </div>
        )}
      </div>

    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Clickable contact card wrapper (intercepts navigation)
// ────────────────────────────────────────────────────────────
function ClickableContactCard({
  contact,
  index = 0,
  onSelect,
}: {
  contact: DbContact;
  index?: number;
  onSelect: (c: DbContact) => void;
}) {
  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onSelect(contact)}
      className="glass-card rounded-xl p-4 block w-full text-left hover:border-primary/30 transition-all duration-200 hover:shadow-md group dark:bg-slate-800 dark:border-slate-700"
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
            <ImportanceBadge level={contact.priority} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {contact.job_title} at {contact.company}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ────────────────────────────────────────────────────────────
// Tab types
// ────────────────────────────────────────────────────────────
type ActiveTab = "contacts" | "vip" | "reminders" | "meetings" | null;

// ────────────────────────────────────────────────────────────
// DashboardPage
// ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { data: contacts = [] } = useContacts();
  const { data: reminders = [] } = useReminders();
  const { data: meetings = [] } = useMeetings();

  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [selectedContact, setSelectedContact] = useState<DbContact | null>(null);
  // Track which tab the user was on before opening a contact
  const [previousTab, setPreviousTab] = useState<ActiveTab>(null);



  const vipCount = contacts.filter((c) => c.priority === "vip").length;
  const pendingReminders = reminders.filter((r) => !r.completed).length;
  const recentContacts = [...contacts]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 4);

  function handleTabClick(tab: ActiveTab) {
    setSelectedContact(null);
    setActiveTab((prev) => (prev === tab ? null : tab));
  }

  function handleSelectContact(contact: DbContact) {
    setPreviousTab(activeTab);
    setSelectedContact(contact);
  }

  function handleBack() {
    setSelectedContact(null);
    setActiveTab(previousTab);
  }

  // Shared grid wrapper for contact lists
  function ContactGrid({ list }: { list: DbContact[] }) {
    if (list.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No contacts found.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map((c, i) => (
          <ClickableContactCard
            key={c.id}
            contact={c}
            index={i}
            onSelect={handleSelectContact}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your networking overview at a glance</p>
      </motion.div>

      {/* ── Stat cards (clickable tabs) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            {
              tab: "contacts" as ActiveTab,
              icon: Users,
              title: "Total Contacts",
              value: contacts.length,
              trend: "+15% this month",
              variant: "glow" as const,
              subtitle: undefined,
            },
            {
              tab: "vip" as ActiveTab,
              icon: Star,
              title: "VIP Contacts",
              value: vipCount,
              subtitle: "Top priority",
              trend: undefined,
              variant: undefined,
            },
            {
              tab: "reminders" as ActiveTab,
              icon: Bell,
              title: "Pending Reminders",
              value: pendingReminders,
              subtitle: "Action needed",
              trend: undefined,
              variant: undefined,
            },
            {
              tab: "meetings" as ActiveTab,
              icon: Calendar,
              title: "Meetings",
              value: meetings.length,
              trend: "+3 this week",
              subtitle: undefined,
              variant: undefined,
            },
          ]
        ).map(({ tab, icon, title, value, subtitle, trend, variant }) => (
          <div
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`cursor-pointer rounded-xl transition-all duration-200 ${
              activeTab === tab
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "hover:ring-1 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-background"
            }`}
          >
            <MetricCard
              icon={icon}
              title={title}
              value={value}
              subtitle={subtitle}
              trend={trend}
              variant={variant}
            />
          </div>
        ))}
      </div>

      {/* ── Sub-view area ── */}
      {selectedContact ? (
        /* Contact detail view */
        <ContactDetailView contact={selectedContact} onBack={handleBack} />
      ) : activeTab !== null ? (
        /* Tab sub-views */
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {activeTab === "contacts" && (
            <>
              <h2 className="font-display font-semibold">
                All Contacts ({contacts.length})
              </h2>
              <ContactGrid
                list={[...contacts].sort((a, b) => a.name.localeCompare(b.name))}
              />
            </>
          )}

          {activeTab === "vip" && (
            <>
              <h2 className="font-display font-semibold">
                VIP Contacts ({vipCount})
              </h2>
              <ContactGrid
                list={contacts
                  .filter((c) => c.priority === "vip")
                  .sort((a, b) => a.name.localeCompare(b.name))}
              />
            </>
          )}

          {activeTab === "reminders" && (
            <>
              <h2 className="font-display font-semibold">
                Pending Reminders ({pendingReminders})
              </h2>
              {reminders.filter((r) => !r.completed).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No pending reminders.
                </p>
              ) : (
                <div className="space-y-2">
                  {reminders
                    .filter((r) => !r.completed)
                    .map((r) => {
                      const contact = contacts.find((c) => c.id === r.contact_id);
                      return (
                        <div
                          key={r.id}
                          className="glass-card rounded-lg px-4 py-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{r.title || r.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {contact?.name} · {r.reminder_date ? new Date(r.reminder_date).toLocaleDateString() : ""}
                            </p>
                          </div>
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}

          {activeTab === "meetings" && (
            <>
              <h2 className="font-display font-semibold">
                Meetings ({meetings.length})
              </h2>
              {meetings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No meetings scheduled.
                </p>
              ) : (
                <div className="space-y-2">
                  {meetings.map((m) => {
                    const contact = contacts.find((c) => c.id === m.contact_id);
                    return (
                      <div
                        key={m.id}
                        className="glass-card rounded-lg px-4 py-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {contact?.name}
                            {m.location ? ` · ${m.location}` : ""}{m.meeting_time ? ` · ${new Date(m.meeting_time).toLocaleDateString()}` : ""}
                          </p>
                          {m.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {m.notes}
                            </p>
                          )}
                        </div>
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </motion.div>
      ) : (
        /* Default dashboard overview — Recent Contacts */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Recent Contacts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentContacts.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No contacts yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Add your first contact to get started</p>
                <a
                  href="/dashboard/contacts"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  + Add your first contact
                </a>
              </div>
            ) : (
              recentContacts.map((c, i) => (
                <ClickableContactCard
                  key={c.id}
                  contact={c}
                  index={i}
                  onSelect={handleSelectContact}
                />
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

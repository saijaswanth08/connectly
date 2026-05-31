import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Users, Star, Bell, Calendar, ArrowLeft, Phone, Mail, Building2, Pencil, Trash2, Loader2, Linkedin, Instagram, ImagePlus, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { MetricCard } from "@/components/MetricCard";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { TagBadge } from "@/components/TagBadge";
import { useReminders } from "@/hooks/useReminders";
import { useMeetings, useContacts } from "@/hooks/useContacts";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DbContact, DbReminder, DbMeeting } from "@/lib/api";
import { AddContactDialog } from "@/components/AddContactDialog";
import { EditContactDialog } from "@/components/EditContactDialog";
import { useDeleteContact } from "@/hooks/useContacts";
import { Skeleton } from "@/components/ui/skeleton";

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
  const initials = (contact.name || "")
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteContact = useDeleteContact();
  const { toast } = useToast();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${contact.name}?`)) return;
    setIsDeleting(true);
    try {
      await deleteContact.mutateAsync(contact.id);
      toast({ title: "Contact deleted" });
      onBack();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <motion.div
      initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isMobile ? 0.12 : 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md hover:bg-primary/10"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-md hover:bg-destructive/10"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>

      <EditContactDialog
        contact={contact}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Contact header card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-5">
          <Avatar className="h-16 w-16 shrink-0">
            {contact.avatar_url && (
              <AvatarImage src={contact.avatar_url} alt={contact.name} className="object-cover" />
            )}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground group/link">
              <Mail className="h-4 w-4 text-primary shrink-0 transition-transform group-hover/link:scale-110" />
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-all duration-200 group-hover/link:text-primary font-medium truncate"
              >
                {contact.email}
              </a>
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
          {contact.linkedin && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground group/link">
              <Linkedin className="h-4 w-4 text-primary shrink-0 transition-transform group-hover/link:scale-110" />
              <a 
                href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-all duration-200 group-hover/link:text-primary font-medium truncate"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
          {contact.instagram && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground group/link">
              <Instagram className="h-4 w-4 text-primary shrink-0 transition-transform group-hover/link:scale-110" />
              <a 
                href={contact.instagram.startsWith('http') ? contact.instagram : `https://instagram.com/${contact.instagram.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-all duration-200 group-hover/link:text-primary font-medium truncate"
              >
                {contact.instagram.includes('instagram.com') ? 'Instagram Profile' : (contact.instagram.startsWith('@') ? contact.instagram : `@${contact.instagram}`)}
              </a>
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
  const initials = (contact.name || "")
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const transitionProps = isMobile
    ? { duration: 0.12 }
    : { delay: Math.min(index, 6) * 0.04, duration: 0.2 };

  return (
    <motion.button
      initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionProps}
      onClick={() => onSelect(contact)}
      className="glass-card rounded-xl p-4 block w-full text-left hover:border-primary/30 transition-all duration-200 hover:shadow-md group dark:bg-slate-800 dark:border-slate-700"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          {contact.avatar_url && (
            <AvatarImage src={contact.avatar_url} alt={contact.name} className="object-cover" />
          )}
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
          {((contact.job_title && contact.job_title.trim()) || (contact.company && contact.company.trim())) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {contact.job_title || "No Title"} {contact.company ? `at ${contact.company}` : ""}
              </span>
            </div>
          )}
          {contact.email && contact.email.trim() && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
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
  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts();
  const { toast } = useToast();
  const { data: reminders = [], isLoading: isLoadingReminders } = useReminders();
  const { data: meetings = [], isLoading: isLoadingMeetings } = useMeetings();

  const isLoading = isLoadingContacts || isLoadingReminders || isLoadingMeetings;

  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [selectedContact, setSelectedContact] = useState<DbContact | null>(null);
  // Track which tab the user was on before opening a contact
  const [previousTab, setPreviousTab] = useState<ActiveTab>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [welcomeBackDelayActive, setWelcomeBackDelayActive] = useState(() => {
    return sessionStorage.getItem("show_welcome_back") === "true";
  });

  useEffect(() => {
    if (welcomeBackDelayActive) {
      toast({
        title: "Welcome back! 👋",
        description: "Successfully signed in to your account.",
      });

      const timer = setTimeout(() => {
        setWelcomeBackDelayActive(false);
        sessionStorage.removeItem("show_welcome_back");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [welcomeBackDelayActive, toast]);

  const SNOOZE_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (!user?.id) return;
    const key = `connectly-dismiss-avatar-prompt-${user.id}`;
    const dismissedAt = localStorage.getItem(key);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < SNOOZE_MS) {
        // Still within snooze window — hide banner and schedule re-show
        setDismissedBanner(true);
        const remaining = SNOOZE_MS - elapsed;
        const timer = setTimeout(() => {
          localStorage.removeItem(key);
          setDismissedBanner(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        // Snooze expired — clear and show banner
        localStorage.removeItem(key);
        setDismissedBanner(false);
      }
    }
  }, [user]);

  useEffect(() => {
    const checkPendingContact = async () => {
      const pendingProfileId = sessionStorage.getItem("pending_save_contact");
      if (pendingProfileId && user) {
        sessionStorage.removeItem("pending_save_contact");
        
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", pendingProfileId)
            .maybeSingle();
            
          if (profile) {
            const { data: existing } = await supabase
              .from("contacts")
              .select("id")
              .eq("user_id", user.id)
              .eq("email", profile.email)
              .maybeSingle();
              
            if (!existing) {
              const payload = {
                user_id: user.id,
                name: profile.name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                linkedin: profile.linkedin_url || "",
                instagram: profile.instagram || "",
                company: profile.company || "",
                job_title: profile.job_title || "",
                avatar_url: profile.avatar_url,
              };
              await supabase.from("contacts").insert(payload);
              toast({ 
                title: "Contact saved ✅", 
                description: `${profile.name} was added to your contacts.` 
              });
            }
          }
        } catch (e) {
          console.error("Failed to save pending contact", e);
        }
      }
    };
    
    checkPendingContact();
  }, [user, toast]);

  const vipCount = contacts.filter((c) => c.priority === "vip").length;
  const pendingReminders = reminders.filter((r) => !r.completed).length;
  const recentContacts = [...contacts]
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .slice(0, 4);

  const showAvatarPrompt =
    !isLoadingProfile &&
    profile &&
    !profile.avatar_url &&
    !dismissedBanner &&
    !welcomeBackDelayActive;

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
      <AddContactDialog open={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your networking overview at a glance</p>
      </motion.div>

      {showAvatarPrompt && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="relative overflow-hidden rounded-xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3 text-white shadow-lg shadow-indigo-500/10 dark:shadow-indigo-950/20">
            {/* Visual glow blobs */}
            <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-md border border-white/25 mt-0.5 sm:mt-0">
                  <ImagePlus className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="font-display font-semibold text-sm leading-tight">Complete your profile photo</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider backdrop-blur-sm w-fit">
                      <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Recommended
                    </span>
                    <span className="text-xs text-indigo-100/80 hidden sm:inline">— A photo helps your network recognize you!</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 -mt-8 sm:mt-0">
                <Link
                  to="/dashboard/profile"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-4 text-xs font-semibold text-indigo-600 shadow hover:bg-indigo-50 transition-all hover:scale-[1.02] active:scale-95 duration-200"
                >
                  Upload Photo
                </Link>
                <button
                  onClick={() => {
                    if (user?.id) {
                      const key = `connectly-dismiss-avatar-prompt-${user.id}`;
                      localStorage.setItem(key, String(Date.now()));
                      setDismissedBanner(true);
                      // Auto re-show after 5 minutes if still no avatar
                      setTimeout(() => {
                        localStorage.removeItem(key);
                        setDismissedBanner(false);
                      }, 5 * 60 * 1000);
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
              variant: "default" as const,
              subtitle: undefined,
              accentColor: "primary" as const,
            },
            {
              tab: "vip" as ActiveTab,
              icon: Star,
              title: "VIP Contacts",
              value: vipCount,
              subtitle: "Top priority",
              trend: undefined,
              variant: "default" as const,
              accentColor: "primary" as const,
            },
            {
              tab: "reminders" as ActiveTab,
              icon: Bell,
              title: "Pending Reminders",
              value: pendingReminders,
              subtitle: "Action needed",
              trend: undefined,
              variant: "default" as const,
              accentColor: "primary" as const,
            },
            {
              tab: "meetings" as ActiveTab,
              icon: Calendar,
              title: "Meetings",
              value: meetings.length,
              trend: "+3 this week",
              subtitle: undefined,
              variant: "default" as const,
              accentColor: "primary" as const,
            },
          ]
        ).map(({ tab, icon, title, value, subtitle, trend, variant, accentColor }) => (
          <div
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`cursor-pointer rounded-xl transition-all duration-200 ${
              activeTab === tab
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "hover:ring-1 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-background"
            }`}
          >
            {isLoading ? (
              <div className="bg-card rounded-xl p-6 border border-border/50 space-y-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded opacity-60" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              </div>
            ) : (
              <MetricCard
                icon={icon}
                title={title}
                value={value}
                subtitle={subtitle}
                trend={trend}
                variant={variant}
                accentColor={accentColor}
              />
            )}
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
          initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.12 : 0.25 }}
          className="space-y-4"
        >
          {activeTab === "contacts" && (
            <>
              <h2 className="font-display font-semibold">
                All Contacts ({contacts.length})
              </h2>
              <ContactGrid
                list={[...contacts].sort((a, b) => (a.name || "").localeCompare(b.name || ""))}
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
                  .sort((a, b) => (a.name || "").localeCompare(b.name || ""))}
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
          initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={isMobile ? { duration: 0.12 } : { delay: 0.2, duration: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Recent Contacts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded opacity-60" />
                  </div>
                </div>
              ))
            ) : recentContacts.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No contacts yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Add your first contact to get started</p>
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  + Add your first contact
                </button>
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

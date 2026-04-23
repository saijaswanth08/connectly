import { useState, useMemo, useEffect } from "react";
import { useContactsStore } from "@/lib/contacts-store";
import { useAuth } from "@/hooks/useAuth";
import { ContactCard } from "@/components/ContactCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { contacts: allContacts, fetchContacts } = useContactsStore();

  useEffect(() => {
    if (user?.id) {
      fetchContacts(user.id);
    }
  }, [user?.id, fetchContacts]);

  const isLoading = allContacts.length === 0 && searchQuery === "";

  // Filter contacts locally based on search query
  const contacts = useMemo(() => {
    if (!searchQuery.trim()) return allContacts;
    const q = searchQuery.toLowerCase();
    return allContacts.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [allContacts, searchQuery]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="md:flex-1">
          <h1 className="text-2xl font-display font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${contacts.length} people in your network`}
          </p>
        </div>
        <div className="relative w-full md:w-[500px] lg:w-[650px] shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
          <Input
            placeholder="Search contacts by name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 md:h-12 w-full text-base rounded-[1rem] border-border/80 shadow-sm transition-all focus-visible:border-[#6366F1] focus-visible:shadow-[0_0_0_2px_rgba(99,102,241,0.15)] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="hidden md:block md:flex-1" />
      </div>


      {/* Loading skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {contacts.map((c, i) => (
              <ContactCard key={c.id} contact={c} index={i} />
            ))}
          </motion.div>

          {contacts.length === 0 && (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center text-center py-20 text-muted-foreground bg-card rounded-xl border border-border/50 shadow-sm mt-2">
              <div className="h-16 w-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                {allContacts.length === 0 ? (
                  <Users className="h-8 w-8 text-primary/60" />
                ) : (
                  <Search className="h-8 w-8 text-primary/60" />
                )}
              </div>
              <p className="text-lg font-display font-semibold text-foreground">
                {allContacts.length === 0 ? "No contacts yet. Add your first contact" : "No contacts found"}
              </p>
              <p className="text-sm mt-1 max-w-sm px-4">
                {allContacts.length === 0
                  ? "Start building your network from the dashboard to see connections here."
                  : "Try adjusting your search or filters to find who you're looking for."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

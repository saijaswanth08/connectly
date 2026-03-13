import { useContactsStore } from "@/lib/contacts-store";
import { ContactCard } from "@/components/ContactCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ContactTag } from "@/lib/types";
import { motion } from "framer-motion";

const allTags: ContactTag[] = ["investor", "client", "mentor", "partner", "recruiter", "friend"];

export default function ContactsPage() {
  const { searchQuery, setSearchQuery, selectedTags, setSelectedTags, filteredContacts } = useContactsStore();
  const contacts = filteredContacts();

  const toggleTag = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
    );
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header: title | search | empty */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="md:flex-1">
          <h1 className="text-2xl font-display font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} people in your network</p>
        </div>
        <div className="relative w-full md:w-[500px] lg:w-[650px] shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
          <Input
            placeholder="Search contacts by name, email, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 md:h-12 w-full text-base rounded-[1rem] border-border/80 shadow-sm transition-all focus-visible:border-[#6366F1] focus-visible:shadow-[0_0_0_2px_rgba(99,102,241,0.15)] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="hidden md:block md:flex-1" />
      </div>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
              selectedTags.includes(tag)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
            }`}
          >
            {tag}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button onClick={() => setSelectedTags([])} className="text-xs text-muted-foreground hover:text-foreground">
            Clear filters
          </button>
        )}
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {contacts.map((c, i) => (
          <ContactCard key={c.id} contact={c} index={i} />
        ))}
      </motion.div>

      {contacts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-display">No contacts found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

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
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} people in your network</p>
        </div>
        <div className="relative w-full sm:max-w-[460px] sm:mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full border-border/60 shadow-sm focus-visible:ring-primary/30"
          />
        </div>
        <div className="hidden sm:block" />
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

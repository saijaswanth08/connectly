import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";

interface ContactSearchSelectProps {
  value: string | null;
  onChange: (contactId: string | null) => void;
}

export function ContactSearchSelect({ value, onChange }: ContactSearchSelectProps) {
  const { data: contacts = [] } = useContacts();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const selectedContact = contacts.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts.slice(0, 8);
    const q = query.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
    ).slice(0, 8);
  }, [contacts, query]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleInputChange(val: string) {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 250);
  }

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function handleClear() {
    onChange(null);
    setQuery("");
  }

  if (selectedContact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground truncate">{selectedContact.name}</span>
        {selectedContact.tags && selectedContact.tags.length > 0 && (
          <span className="text-xs text-muted-foreground">({selectedContact.tags[0]})</span>
        )}
        <button
          type="button"
          onClick={handleClear}
          className="ml-auto shrink-0 rounded-full p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts by name or tag..."
          className="pl-9 rounded-lg border-border/60 shadow-sm"
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground text-center">No contacts found</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[c.tags?.[0], c.company].filter(Boolean).join(" · ") || "No tags"}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

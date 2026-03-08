import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Users, MessagesSquare, Calendar, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  type: "contact" | "meeting" | "reminder";
  url: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim() || !user?.id) {
        setResults([]);
        return;
      }
      setLoading(true);
      const searchTerm = `%${q}%`;

      const [contacts, meetings, reminders] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, name, company, email")
          .eq("user_id", user.id)
          .or(`name.ilike.${searchTerm},company.ilike.${searchTerm},email.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from("meetings")
          .select("id, title, status")
          .eq("user_id", user.id)
          .ilike("title", searchTerm)
          .limit(5),
        supabase
          .from("reminders")
          .select("id, title")
          .eq("user_id", user.id)
          .ilike("title", searchTerm)
          .limit(5),
      ]);

      const items: SearchResult[] = [
        ...(contacts.data || []).map((c) => ({
          id: c.id,
          label: c.name,
          sublabel: c.company || c.email || undefined,
          type: "contact" as const,
          url: `/dashboard/contacts/${c.id}`,
        })),
        ...(meetings.data || []).map((m) => ({
          id: m.id,
          label: m.title,
          sublabel: m.status,
          type: "meeting" as const,
          url: "/dashboard/interactions",
        })),
        ...(reminders.data || []).map((r) => ({
          id: r.id,
          label: r.title,
          sublabel: "Reminder",
          type: "reminder" as const,
          url: "/dashboard/reminders",
        })),
      ];

      setResults(items);
      setLoading(false);
    },
    [user?.id]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const iconMap = {
    contact: Users,
    meeting: Calendar,
    reminder: Bell,
  };

  return (
    <>
      <Button
        variant="outline"
        className="hidden sm:flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground rounded-lg border-border/60 bg-muted/40 hover:bg-muted/60 w-56"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
          ⌘K
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden h-9 w-9 rounded-full"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search contacts, meetings, reminders..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching..." : "No results found."}
          </CommandEmpty>
          {results.length > 0 && (
            <>
              {["contact", "meeting", "reminder"].map((type) => {
                const group = results.filter((r) => r.type === type);
                if (!group.length) return null;
                const Icon = iconMap[type as keyof typeof iconMap];
                const groupLabel = type === "contact" ? "Contacts" : type === "meeting" ? "Meetings" : "Reminders";
                return (
                  <CommandGroup key={type} heading={groupLabel}>
                    {group.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.label}
                        onSelect={() => {
                          navigate(item.url);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="gap-3"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{item.label}</p>
                          {item.sublabel && (
                            <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

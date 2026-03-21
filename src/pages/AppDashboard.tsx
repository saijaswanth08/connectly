import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { DbContact } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, Search } from "lucide-react";

export default function AppDashboard() {
  const { session, user: authUser } = useAuth(); // Using session from context
  const [contacts, setContacts] = useState<DbContact[]>([]);
  const [isLoading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        console.log("SESSION:", session);
        setLoading(true);
        
        // 1. Get authenticated user explicitly for the query
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log("USER:", user);
        
        if (authError || !user) {
          console.warn("User not authenticated or missing.");
          if (isMounted) setLoading(false);
          return;
        }

        console.log("FETCHING CONTACTS FOR:", user.id);

        // 2. Fetch contacts for this user
        const { data, error: fetchError } = await supabase
          .from("contacts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        console.log("QUERY RESULT:", data);

        if (fetchError) {
          console.error("ERROR FETCHING CONTACTS:", fetchError);
          throw fetchError;
        }

        if (isMounted) {
          setContacts(data || []);
        }
      } catch (err: any) {
        console.error("DASHBOARD FATAL ERROR:", err);
        toast({
          title: "Error fetching data",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("DASHBOARD LOADING COMPLETE");
        }
      }
    }

    fetchDashboardData();

    // 3. Realtime subscription (Optional Improvement)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contacts',
        filter: `user_id=eq.${authUser?.id}` 
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [session, authUser, toast]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <p className="text-center text-muted-foreground animate-pulse">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your professional network.</p>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold">No contacts found</h2>
          <p className="text-muted-foreground max-w-sm text-center px-4 mt-2">
            Start building your network by adding your first contact from the sidebar or dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              className="p-5 rounded-2xl border bg-card hover:shadow-md transition-shadow group"
            >
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {contact.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {contact.job_title} {contact.company ? `@ ${contact.company}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {contact.tags?.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

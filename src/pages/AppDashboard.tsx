// ⛔ DISABLED — Route /dashboard now points to DashboardPage.tsx
// This component called supabase.from('contacts').select() causing infinite "Loading contacts..."
// DO NOT re-enable or import this component. It is kept for reference only.
// ---------------------------------

import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { DbContact } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, Search } from "lucide-react";

export default function AppDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<DbContact[]>([]);
  const [isLoading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      if (!user) {
        if (isMounted && !authLoading) setLoading(false);
        return;
      }

      try {
        setLoading(true);

        console.log("FETCHING CONTACTS FOR:", user.id);

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
          setContacts(
            (data || []).map((item) => ({
              ...item,
              tags: (item as any).tags ?? [],
            }))
          );
        }
      } catch (err: any) {
        console.error("Dashboard error:", err);
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

    if (!authLoading) {
      fetchDashboardData();
    }

    // 3. Realtime subscription (Optional Improvement)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contacts',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, toast]);

  if (isLoading || authLoading) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <p className="text-center text-muted-foreground animate-pulse mt-4">Loading contacts...</p>
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
            Start building your network by adding your first contact.
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

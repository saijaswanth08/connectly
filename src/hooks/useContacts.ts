import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { fetchContacts, createContact, updateContact, deleteContact, searchContacts, fetchMeetings, createMeeting, updateMeeting, deleteMeeting, DbContact, DbMeeting } from "@/lib/api";

function getContactScore(c: DbContact): number {
  let score = 0;
  if (c.email && c.email.trim()) score += 10;
  if (c.phone && c.phone.trim()) score += 5;
  if (c.company && c.company.trim()) score += 3;
  if (c.job_title && c.job_title.trim()) score += 2;
  if (c.avatar_url && c.avatar_url.trim()) score += 4;
  if (c.target_user_id) score += 20; // Active linked account is high priority
  if (c.priority === "vip") score += 1;
  return score;
}

export function deduplicateContacts(contacts: DbContact[]): DbContact[] {
  if (!contacts || contacts.length === 0) return [];

  // Sort by completeness score descending
  const sorted = [...contacts].sort((a, b) => {
    const scoreA = getContactScore(a);
    const scoreB = getContactScore(b);
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return (b.created_at || "").localeCompare(a.created_at || "");
  });

  const uniqueContacts: DbContact[] = [];
  const seenEmails = new Set<string>();

  for (const c of sorted) {
    const email = c.email?.trim().toLowerCase();

    let isDuplicate = false;

    if (email && seenEmails.has(email)) {
      isDuplicate = true;
    }

    if (!isDuplicate) {
      uniqueContacts.push(c);
      if (email) seenEmails.add(email);
    }
  }

  // Restore original ordering
  const originalIdOrder = new Map(contacts.map((c, index) => [c.id, index]));
  const result = uniqueContacts.sort((a, b) => {
    return (originalIdOrder.get(a.id) ?? 0) - (originalIdOrder.get(b.id) ?? 0);
  });
  
  console.log("DEBUG: deduplicateContacts fetched", contacts.length, "rows from DB. Returned", result.length, "rows.");
  if (contacts.length !== result.length) {
    console.log("DEBUG: Contacts hidden by deduplication:", contacts.filter(c => !result.find(r => r.id === c.id)));
  }
  
  return result;
}

export function useContacts() {
  const { user } = useAuth();
  return useQuery<DbContact[]>({
    queryKey: ["contacts", user?.id],
    queryFn: fetchContacts,
    enabled: !!user?.id,
    refetchOnMount: true,
    select: deduplicateContacts,
  });
}

export function useSearchContacts(query: string) {
  const { user } = useAuth();
  return useQuery<DbContact[]>({
    queryKey: ["contacts", "search", query, user?.id],
    queryFn: () => (query ? searchContacts(query) : fetchContacts()),
    enabled: !!user?.id,
    select: deduplicateContacts,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DbContact> }) => updateContact(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useMeetings() {
  return useQuery<DbMeeting[]>({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMeeting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DbMeeting> }) => updateMeeting(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { fetchContacts, createContact, updateContact, deleteContact, searchContacts, fetchMeetings, createMeeting, updateMeeting, deleteMeeting, DbContact, DbMeeting } from "@/lib/api";

export function useContacts() {
  const { user } = useAuth();
  return useQuery<DbContact[]>({
    queryKey: ["contacts", user?.id],
    queryFn: fetchContacts,
    enabled: !!user?.id,
    refetchOnMount: true,
  });
}

export function useSearchContacts(query: string) {
  const { user } = useAuth();
  return useQuery<DbContact[]>({
    queryKey: ["contacts", "search", query, user?.id],
    queryFn: () => (query ? searchContacts(query) : fetchContacts()),
    enabled: !!user?.id,
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

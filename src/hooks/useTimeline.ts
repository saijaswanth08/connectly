import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTimelineEvents, createTimelineEvent, deleteTimelineEvent, DbTimelineEvent } from "@/lib/api";

export function useTimelineEvents(contactId?: string) {
  return useQuery<DbTimelineEvent[]>({
    queryKey: ["timeline_events", contactId],
    queryFn: () => fetchTimelineEvents(contactId),
  });
}

export function useCreateTimelineEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTimelineEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timeline_events"] }),
  });
}

export function useDeleteTimelineEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTimelineEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timeline_events"] }),
  });
}

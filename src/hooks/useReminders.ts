import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReminders, createReminder, updateReminder, deleteReminder, DbReminder } from "@/lib/api";

export function useReminders() {
  return useQuery<DbReminder[]>({
    queryKey: ["reminders"],
    queryFn: fetchReminders,
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReminder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DbReminder> }) => updateReminder(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

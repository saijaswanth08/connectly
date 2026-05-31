import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReminders, createReminder, updateReminder, deleteReminder, DbReminder } from "@/lib/api";
import { useAuth } from "./useAuth";

export function useReminders() {
  const { user } = useAuth();
  return useQuery<DbReminder[]>({
    queryKey: ["reminders", user?.id],
    queryFn: async () => {
      const data = await fetchReminders();
      if (user?.id) {
        localStorage.setItem(`connectly-reminders-cache-${user.id}`, JSON.stringify(data));
      }
      return data;
    },
    enabled: !!user?.id,
    initialData: () => {
      if (typeof window !== "undefined" && user?.id) {
        try {
          const cached = localStorage.getItem(`connectly-reminders-cache-${user.id}`);
          if (cached) return JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse cached reminders", e);
        }
      }
      return undefined;
    },
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

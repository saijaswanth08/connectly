import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContactConnections, createContactConnection, deleteContactConnection, DbContactConnection } from "@/lib/api";

export function useContactConnections() {
  return useQuery<DbContactConnection[]>({
    queryKey: ["contact_connections"],
    queryFn: fetchContactConnections,
  });
}

export function useCreateContactConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createContactConnection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact_connections"] }),
  });
}

export function useDeleteContactConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteContactConnection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact_connections"] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContactConnections, createContactConnection, deleteContactConnection, DbContactConnection } from "@/lib/api";
import { useAuth } from "./useAuth";

export function useContactConnections() {
  const { user } = useAuth();
  return useQuery<DbContactConnection[]>({
    queryKey: ["contact_connections", user?.id],
    queryFn: fetchContactConnections,
    enabled: !!user?.id,
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchIncomingContactRequests,
  fetchOutgoingAcceptedRequests,
  sendContactRequest,
  acceptContactRequest,
  declineContactRequest,
  addContactFromAcceptedRequest,
  DbContactRequest,
} from '@/lib/contactRequestsApi';

export type { DbContactRequest };

export function useIncomingContactRequests() {
  return useQuery<DbContactRequest[]>({
    queryKey: ['contact_requests', 'incoming'],
    queryFn: fetchIncomingContactRequests,
  });
}

export function useOutgoingAcceptedRequests() {
  return useQuery<DbContactRequest[]>({
    queryKey: ['contact_requests', 'accepted_outgoing'],
    queryFn: fetchOutgoingAcceptedRequests,
  });
}

export function useSendContactRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendContactRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact_requests'] }),
  });
}

export function useAcceptContactRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, fromUserId }: { requestId: string; fromUserId: string }) =>
      acceptContactRequest(requestId, fromUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact_requests'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useDeclineContactRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: declineContactRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact_requests'] }),
  });
}

export function useAddContactFromAccepted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, toUserId }: { requestId: string; toUserId: string }) =>
      addContactFromAcceptedRequest(requestId, toUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact_requests'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

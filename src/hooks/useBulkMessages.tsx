import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BulkMessage {
  id: number;
  scheduled_at: string;
  media_url?: string;
  message: string;
  status: 'pending' | 'sent';
  created_at: string;
}

export interface BulkClient {
  customer_name: string;
  customer_phone: string;
}

export const useBulkMessages = () => {
  const queryClient = useQueryClient();

  const bulkMessagesQuery = useQuery<BulkMessage[]>({
    queryKey: ['bulkMessages'],
    queryFn: async () => {
      return api.get<BulkMessage[]>('/bulk-messages');
    }
  });

  const clientsQuery = useQuery<BulkClient[]>({
    queryKey: ['bulkClients'],
    queryFn: async () => {
      return api.get<BulkClient[]>('/bulk-messages?id=clients');
    }
  });

  const createBulkMessage = useMutation({
    mutationFn: async (message: Partial<BulkMessage>) => {
      return api.post<BulkMessage>('/bulk-messages', message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkMessages'] });
    }
  });

  const deleteBulkMessage = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/bulk-messages?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkMessages'] });
    }
  });

  return {
    bulkMessages: bulkMessagesQuery.data || [],
    isLoadingBulk: bulkMessagesQuery.isLoading,
    clients: clientsQuery.data || [],
    isLoadingClients: clientsQuery.isLoading,
    createBulkMessage,
    deleteBulkMessage
  };
};

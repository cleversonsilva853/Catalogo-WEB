import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BulkMessage {
  id: number;
  scheduled_at: string;
  media_url: string | null;
  message: string;
  status: 'pending' | 'sent';
  created_at: string;
}

export function useBulkMessages() {
  const queryClient = useQueryClient();

  const query = useQuery<BulkMessage[]>({
    queryKey: ['bulk-messages'],
    queryFn: async () => {
      return await api.get<BulkMessage[]>('/bulk-messages');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newMessage: Partial<BulkMessage>) => {
      return await api.post<{ success: true, id: number }>('/bulk-messages', newMessage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-messages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete<{ success: true }>(`/bulk-messages?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-messages'] });
    },
  });

  return {
    ...query,
    createBulkMessage: createMutation,
    deleteBulkMessage: deleteMutation,
  };
}

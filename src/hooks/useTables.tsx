import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Table {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  status: string; // 'available' | 'occupied' | 'reserved'
  current_order_id?: number | null;
  created_at: string;
  updated_at: string;
}

export function useTables() {
  return useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get<Table[]>('/tables'),
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Table>) => api.post<Table>('/tables', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Table> }) => api.put<Table>(`/tables/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tables/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  min_order_value: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => api.get<DeliveryZone[]>('/delivery-zones'),
  });
}

export function useCreateDeliveryZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<DeliveryZone, 'id' | 'created_at' | 'updated_at'>) => api.post<DeliveryZone>('/delivery-zones', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-zones'] }),
  });
}

export function useUpdateDeliveryZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<DeliveryZone> & { id: string }) => api.put<DeliveryZone>(`/delivery-zones/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-zones'] }),
  });
}

export function useDeleteDeliveryZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/delivery-zones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-zones'] }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface KitchenItem {
  id: string;
  order_id: number;
  order_type: 'delivery' | 'table';
  product_name: string;
  quantity: number;
  observation: string | null;
  status: 'pending' | 'preparing' | 'ready';
  created_at: string;
  ordered_at?: string;
  table_number?: number | null;
  table_name?: string | null;
  table_order_id?: number | null;
  customer_name?: string | null;
  waiter_name?: string | null;
  comanda_numero?: number | null;
}

export function useKitchenItems() {
  return useQuery({
    queryKey: ['kitchen-items'],
    queryFn: () => api.get<KitchenItem[]>('/orders/kitchen'),
    refetchInterval: 5000,
  });
}

export function useUpdateKitchenItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { itemId: string; status: 'pending' | 'preparing' | 'ready'; orderType: 'delivery' | 'table' }) => 
      api.put(`/orders/kitchen/${params.itemId}`, { 
        status: params.status, 
        order_type: params.orderType 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
    },
  });
}

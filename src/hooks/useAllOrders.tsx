import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UnifiedOrder {
  id: number;
  type: 'delivery' | 'table';
  customer_name: string;
  customer_phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_complement: string | null;
  address_reference: string | null;
  total_amount: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivery' | 'completed' | 'cancelled';
  payment_method: string | null;
  change_for: number | null;
  created_at: string;
  updated_at: string;
  // Geolocation
  latitude?: number | null;
  longitude?: number | null;
  // Table order specific
  table_id?: string | null;
  table_number?: number | null;
  table_name?: string | null;
  waiter_name?: string | null;
  customer_count?: number | null;
  // Driver info
  driver_id?: string | null;
  driver_name?: string | null;
}

export interface UnifiedOrderItem {
  id: string;
  order_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  observation: string | null;
}

export function useAllOrders() {
  return useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      // API agregadora em PHP (/orders/all handles delivery and table unified)
      return api.get<UnifiedOrder[]>('/orders/all');
    },
    refetchInterval: 5000,
  });
}

export function useUnifiedOrderItems(orderId: number, orderType: 'delivery' | 'table') {
  return useQuery({
    queryKey: ['unified-order-items', orderId, orderType],
    queryFn: () => api.get<UnifiedOrderItem[]>('/orders/items', { order_id: String(orderId), order_type: orderType }),
    enabled: !!orderId,
  });
}

export function useUpdateUnifiedOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: number; status: UnifiedOrder['status']; orderType: 'delivery' | 'table'; }) => 
      api.put(`/orders/unified-status/${params.orderId}`, { 
        status: params.status, 
        order_type: params.orderType 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-items'] });
    },
  });
}

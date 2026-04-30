import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_complement: string | null;
  address_reference: string | null;
  total_amount: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivery' | 'completed' | 'cancelled';
  payment_method: 'money' | 'card' | 'pix' | 'credit' | 'debit';
  change_for: number | null;
  driver_id: string | null;
  driver_name: string | null;
  delivery_fee: number;
  coupon_code: string | null;
  discount_amount: number;
  table_number?: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: number;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  observation: string | null;
  addons?: unknown[];
}

export interface CreateOrderData {
  customer_name: string;
  customer_phone: string;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_complement?: string | null;
  address_reference?: string | null;
  total_amount: number;
  payment_method: 'money' | 'card' | 'pix' | 'credit' | 'debit';
  change_for?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  delivery_zone_id?: string | null;
  delivery_fee?: number;
  coupon_code?: string | null;
  discount_amount?: number;
  table_number?: number | null;
}

export interface CreateOrderItemData {
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  observation?: string | null;
  addons?: unknown[];
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Order[]>('/orders'),
  });
}

export function useOrderItems(orderId: number) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: () => api.get<OrderItem[]>(`/order-items`, { order_id: String(orderId) }),
    enabled: !!orderId,
  });
}

const CUSTOMER_PHONE_KEY = 'delivery-customer-phone';

export function saveCustomerPhone(phone: string) {
  try { localStorage.setItem(CUSTOMER_PHONE_KEY, phone); } catch { /* ignore */ }
}

export function getCustomerPhone(): string | null {
  try { return localStorage.getItem(CUSTOMER_PHONE_KEY); } catch { return null; }
}

export function useOrderWithItems(orderId: number) {
  const customerPhone = getCustomerPhone();

  const orderQuery = useQuery({
    queryKey: ['order', orderId, customerPhone],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (customerPhone) params.phone = customerPhone;
      const res = await api.get<{ order: Order; items: OrderItem[] }>(`/orders/${orderId}`, params);
      return res;
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = (query.state.data as { order?: Order })?.order?.status;
      if (!customerPhone) return false;
      if (!status) return 5000;
      return status === 'completed' || status === 'cancelled' ? false : 5000;
    },
    refetchIntervalInBackground: true,
  });

  return {
    order: orderQuery.data?.order,
    items: orderQuery.data?.items,
    isLoading: orderQuery.isLoading,
    error: orderQuery.error,
  };
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ order, items }: { order: CreateOrderData; items: CreateOrderItemData[] }) =>
      api.post<{ id: number }>('/orders', { ...order, items }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: Order['status'] }) =>
      api.put<Order>(`/orders/${orderId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

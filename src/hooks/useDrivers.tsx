import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  commission_percentage: number;
  created_at: string;
  updated_at: string;
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.get<Driver[]>('/drivers'),
  });
}

export function useActiveDrivers() {
  return useQuery({
    queryKey: ['drivers', 'active'],
    queryFn: () => api.get<Driver[]>('/drivers', { active: 'true' }),
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; phone?: string; commission_percentage?: number }) => 
      api.post<Driver>('/drivers', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) => 
      api.put<Driver>(`/drivers/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, driverId, driverName }: { orderId: number; driverId: string; driverName: string }) => 
      api.put(`/orders/${orderId}`, { driver_id: driverId, driver_name: driverName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
    },
  });
}

export function useDriverOrders(driverId: string | null) {
  return useQuery({
    queryKey: ['driver-orders', driverId],
    queryFn: async () => {
      if (!driverId) return [];
      // The backend orders.php needs support for filtering by driver_id, we will do client side filtering or update backend. 
      // For now let's just fetch all and filter client-side as fallback, or pass driver_id.
      // Wait, let's fetch all active orders from /orders and filter them
      const res: any = await api.get('/orders');
      return res.filter((o: any) => o.driver_id === driverId && (o.status === 'ready' || o.status === 'delivery'));
    },
    enabled: !!driverId,
    refetchInterval: 5000,
  });
}

export function useDriverOrderItems(orderId: number) {
  return useQuery({
    queryKey: ['driver-order-items', orderId],
    queryFn: () => api.get<any[]>(`/order-items`, { order_id: String(orderId) }),
    enabled: !!orderId,
  });
}

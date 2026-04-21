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

export function useDriver(id: string | null) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: () => api.get<Driver>(`/drivers/${id}`),
    enabled: !!id,
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

export function useUpdateDriverOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: 'ready' | 'delivery' | 'completed' }) => 
      api.put(`/orders/${orderId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
    },
  });
}

export function useDriverOrders(driverId: string | null) {
  return useQuery({
    queryKey: ['driver-orders', driverId],
    queryFn: async () => {
      if (!driverId) return [];
      const res: any = await api.get('/orders');
      // Filtramos pedidos que estão prontos para retirada ou em entrega pelo entregador específico
      return res.filter((o: any) => 
        (o.driver_id === driverId || !o.driver_id) && 
        (o.status === 'ready' || o.status === 'delivery')
      );
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

export function useDriverReportOrders(driverId: string | null) {
  return useQuery({
    queryKey: ['driver-report-orders', driverId],
    queryFn: () => api.get<any[]>(`/orders/driver/${driverId}`),
    enabled: !!driverId,
  });
}

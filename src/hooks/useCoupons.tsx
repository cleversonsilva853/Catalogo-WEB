import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => api.get<Coupon[]>('/coupons'),
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      // The PHP api handles the exact validation
      return api.get<Coupon>('/coupons/validate', { code: code.toUpperCase(), order_total: orderTotal });
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (coupon: Omit<Coupon, 'id' | 'current_uses' | 'created_at'>) => {
      return api.post<Coupon>('/coupons', {
        ...coupon,
        code: coupon.code.toUpperCase(),
        current_uses: 0,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...update }: Partial<Coupon> & { id: string }) => 
      api.put<Coupon>(`/coupons/${id}`, update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function calculateDiscount(coupon: Coupon, orderTotal: number): number {
  if (coupon.discount_type === 'percentage') {
    return (orderTotal * coupon.discount_value) / 100;
  }
  return coupon.discount_value;
}

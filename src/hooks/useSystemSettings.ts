import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SystemSettings {
  id: number;
  stock_enabled: boolean;
  product_stock_enabled: boolean;
  consume_on_site_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get<any>('/store');
      return {
        id: 1,
        stock_enabled: res.stock_enabled === true || res.stock_enabled == 1,
        product_stock_enabled: res.product_stock_enabled === true || res.product_stock_enabled == 1,
        consume_on_site_enabled: res.consume_on_site_enabled === true || res.consume_on_site_enabled == 1,
      } as SystemSettings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (update: Partial<Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>>) => 
      api.put('/store', update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
  });
}

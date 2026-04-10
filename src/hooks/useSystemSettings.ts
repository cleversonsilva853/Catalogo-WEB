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
      // Usando uma rota fictícia /system_settings. Se não existir no backend ainda, vai retornar fallback.
      try {
        const res = await api.get<SystemSettings>('/system-settings');
        return res;
      } catch (e) {
        return {
          id: 1,
          stock_enabled: true,
          product_stock_enabled: true,
          consume_on_site_enabled: true,
        } as SystemSettings;
      }
    },
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (update: Partial<Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>>) => 
      api.put('/system-settings', update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}

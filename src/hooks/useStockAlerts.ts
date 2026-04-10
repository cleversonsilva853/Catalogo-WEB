import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Como MySQL na HostGator não exibe realtime puro sem websocket extra,
// adaptamos para polling a cada minuto para checar ingredientes abaixo do mínimo.
export function useStockAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const ingredients = await api.get<any[]>('/ingredients');
        alertsQueue(ingredients);
      } catch (e) {
        // fail silent
      }
    }, 60000);

    const alertsQueue = (ingredients: any[]) => {
      for (const item of ingredients) {
        if (item.stock_quantity <= item.min_stock) {
          toast({
            title: '⚠️ Estoque no mínimo / Baixo',
            description: `O ingrediente ${item.name} atingiu limite de estoque. Quantidade atual: ${item.stock_quantity} ${item.unit || ''}`,
            variant: 'destructive',
          });
        }
      }
    };

    return () => clearInterval(interval);
  }, [toast, queryClient]);
}

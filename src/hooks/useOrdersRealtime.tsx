import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAllOrders } from './useAllOrders';

export function useOrdersRealtime() {
  const queryClient = useQueryClient();
  
  // Como `useAllOrders` agora faz pooling a cada 5s, não precisamos do websocket real.
  // Mantemos o hook vazio apenas para compatibilidade, ou podemos emitir logs.
  useEffect(() => {
    // Polling is handled by useAllOrders refetchInterval
  }, []);
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Comanda {
  id: string;
  numero_comanda: number;
  status: string; // 'livre' | 'ocupada'
  created_at: string;
}

export interface ComandaPedido {
  id: string;
  comanda_id: string;
  pedido_id: number;
  created_at: string;
}

export function useComandas() {
  return useQuery({
    queryKey: ['comandas'],
    queryFn: () => api.get<Comanda[]>('/comandas'),
  });
}

export function useComandaPedidos(comandaId?: string) {
  return useQuery({
    queryKey: ['comanda-pedidos', comandaId],
    queryFn: async () => {
      if (!comandaId) return [];
      return api.get<ComandaPedido[]>('/comandas/pedidos', { comanda_id: comandaId });
    },
    enabled: !!comandaId,
  });
}

export function useComandaOrderDetails(comandaId?: string) {
  return useQuery({
    queryKey: ['comanda-order-details', comandaId],
    queryFn: async () => {
      if (!comandaId) return [];
      return api.get<any[]>('/comandas/order-details', { comanda_id: comandaId });
    },
    enabled: !!comandaId,
  });
}

export function useCreateComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (numeroComanda: number) => api.post<Comanda>('/comandas', { numero_comanda: numeroComanda, status: 'livre' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comandas'] }),
  });
}

export function useDeleteComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/comandas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comandas'] }),
  });
}

export function useUpdateComandaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/comandas/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comandas'] }),
  });
}

export function useCreateComandaOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comandaId, numeroComanda, items }: {
      comandaId: string;
      numeroComanda: number;
      items: any[];
    }) => api.post('/comandas/orders', { comanda_id: comandaId, numero_comanda: numeroComanda, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas'] });
      queryClient.invalidateQueries({ queryKey: ['comanda-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['comanda-order-details'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-items'] });
    },
  });
}

export function useCloseSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { comandaId: string; valorTotal: number; formaPagamento: string; }) => 
      api.post('/comandas/close', {
        comanda_id: params.comandaId,
        valor_total: params.valorTotal,
        forma_pagamento: params.formaPagamento
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas'] });
      queryClient.invalidateQueries({ queryKey: ['comanda-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['comanda-order-details'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
    },
  });
}

export function useTransferOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { sourceComandaId: string; targetComandaId: string; targetNumeroComanda: number; }) => 
      api.post('/comandas/transfer', {
        source_comanda_id: params.sourceComandaId,
        target_comanda_id: params.targetComandaId,
        target_numero_comanda: params.targetNumeroComanda
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['comanda-pedidos'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['comanda-order-details'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['orders'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['all-orders'], refetchType: 'all' });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CaixaSession {
  id: string;
  opened_at: string;
  closed_at: string | null;
  initial_balance: number;
  status: 'open' | 'closed';
  created_at: string;
}

export interface CaixaMovimentacao {
  id: string;
  session_id: string;
  type: 'entrada' | 'saida' | 'sangria';
  amount: number;
  description: string | null;
  created_at: string;
}

export function useOpenedSession() {
  return useQuery({
    queryKey: ['caixa-session-active'],
    queryFn: () => api.get<CaixaSession | null>('/caixa/active'),
  });
}

export function useOpenCaixa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (initialBalance: number) => api.post<CaixaSession>('/caixa/open', { initial_balance: initialBalance }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caixa-session-active'] }),
  });
}

export function useSangria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { sessionId: string; amount: number; description: string }) => 
      api.post<CaixaMovimentacao>('/caixa/movimentacoes', {
        session_id: params.sessionId,
        type: 'sangria',
        amount: params.amount,
        description: params.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['caixa-balance'] });
    },
  });
}

export function useAddMovimentacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { sessionId: string; type: 'entrada' | 'saida' | 'sangria'; amount: number; description?: string }) => 
      api.post<CaixaMovimentacao>('/caixa/movimentacoes', {
        session_id: params.sessionId,
        type: params.type,
        amount: params.amount,
        description: params.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['caixa-balance'] });
    },
  });
}

export function useCaixaBalance(sessionId?: string) {
  return useQuery({
    queryKey: ['caixa-balance', sessionId],
    queryFn: async () => {
      if (!sessionId) return { initial: 0, entradas: 0, saidas: 0, current: 0 };
      return api.get<any>('/caixa/balance', { session_id: sessionId });
    },
    enabled: !!sessionId,
  });
}

export function useCloseCaixa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.post('/caixa/close', { session_id: sessionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caixa-session-active'] }),
  });
}

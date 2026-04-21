import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const PERM_KEYS = [
  'perm_dashboard',
  'perm_cozinha',
  'perm_entregadores',
  'perm_pdv',
  'perm_pedidos',
  'perm_produtos',
  'perm_categorias',
  'perm_acrescimos',
  'perm_cupons',
  'perm_relatorios',
  'perm_taxas_entrega',
  'perm_horarios',
  'perm_configuracoes',
  'perm_qrcode',
  'perm_usuarios',
  'perm_backup',
  'perm_consumir_local',
  'perm_redes_sociais',
] as const;

export type PermKey = typeof PERM_KEYS[number];

export const PERM_LABELS: Record<PermKey, string> = {
  perm_dashboard: 'Dashboard',
  perm_cozinha: 'Cozinha',
  perm_entregadores: 'Entregadores',
  perm_pdv: 'PDV',
  perm_pedidos: 'Pedidos',
  perm_produtos: 'Produtos',
  perm_categorias: 'Categorias',
  perm_acrescimos: 'Acréscimos',
  perm_cupons: 'Cupons',
  perm_relatorios: 'Relatórios',
  perm_taxas_entrega: 'Taxas de Entrega',
  perm_horarios: 'Horários',
  perm_configuracoes: 'Configurações',
  perm_qrcode: 'QR Codes',
  perm_usuarios: 'Usuários',
  perm_backup: 'Backup',
  perm_consumir_local: 'Consumir no Local',
  perm_redes_sociais: 'Redes Sociais',
};

export type PermMap = Record<PermKey, boolean>;

export interface AdminUser {
  id: string;
  usuario: string;
  acesso_operacoes: boolean;
  acesso_gestao: boolean;
  acesso_sistema: boolean;
  created_at: string;
  login_email?: string;
  perm_dashboard: boolean;
  perm_cozinha: boolean;
  perm_entregadores: boolean;
  perm_pdv: boolean;
  perm_pedidos: boolean;
  perm_produtos: boolean;
  perm_categorias: boolean;
  perm_acrescimos: boolean;
  perm_cupons: boolean;
  perm_relatorios: boolean;
  perm_taxas_entrega: boolean;
  perm_horarios: boolean;
  perm_configuracoes: boolean;
  perm_qrcode: boolean;
  perm_usuarios: boolean;
  perm_backup: boolean;
  perm_consumir_local: boolean;
  perm_redes_sociais: boolean;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<AdminUser[]>('/admin-users'),
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { usuario: string; senha?: string; permissions?: PermMap }) => {
      const payload = {
        usuario: params.usuario,
        senha: params.senha || 'admin123',
        ...(params.permissions || {}),
      };
      return api.post('/admin-users', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; usuario?: string; senha?: string; permissions?: PermMap }) => {
      const { id, senha, permissions, ...rest } = params;
      const payload: any = { ...rest, ...(permissions || {}) };
      if (senha) payload.nova_senha = senha;
      return api.put(`/admin-users/${id}`, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin-users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

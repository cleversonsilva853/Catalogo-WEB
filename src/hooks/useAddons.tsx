import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';


export interface AddonGroup {
  id: string;
  name: string;
  title: string;
  subtitle: string | null;
  is_required: boolean;
  max_selections: number;
  sort_order: number;
  options?: AddonOption[];
}

export interface AddonOption {
  id: string;
  group_id: string;
  name: string;
  price: number;
  is_available: boolean;
  sort_order: number;
}

export interface ProductAddonGroup {
  id: string;
  product_id: string;
  addon_group_id: string;
}

export function useAddonGroups() {
  return useQuery({
    queryKey: ['addon-groups'],
    queryFn: () => api.get<AddonGroup[]>('/addons/groups'),
  });
}

export function useCreateAddonGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: Omit<AddonGroup, 'id'>) => api.post<AddonGroup>('/addons/groups', group),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addon-groups'] }),
  });
}

export function useUpdateAddonGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...update }: Partial<AddonGroup> & { id: string }) => 
      api.put<AddonGroup>(`/addons/groups/${id}`, update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addon-groups'] }),
  });
}

export function useDeleteAddonGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/addons/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      queryClient.invalidateQueries({ queryKey: ['addon-options'] });
    },
  });
}

export function useAddonOptions(groupId?: string) {
  return useQuery({
    queryKey: ['addon-options', groupId],
    queryFn: () => {
      const qs = groupId ? { group_id: groupId } : undefined;
      return api.get<AddonOption[]>('/addons/options', qs);
    },
  });
}

export function useCreateAddonOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (option: Omit<AddonOption, 'id'>) => api.post<AddonOption>('/addons/options', option),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-options'] });
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
    },
  });
}

export function useUpdateAddonOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...update }: Partial<AddonOption> & { id: string }) => 
      api.put<AddonOption>(`/addons/options/${id}`, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-options'] });
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
    },
  });
}

export function useDeleteAddonOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/addons/options/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-options'] });
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
    },
  });
}

export function useProductAddonGroups(productId?: string) {
  return useQuery({
    queryKey: ['product-addon-groups', productId],
    queryFn: async () => {
      if (!productId) return [];
      return api.get<any[]>('/addons/product-groups', { product_id: productId });
    },
    enabled: !!productId,
  });
}

export function useAddProductAddonGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { product_id: string; addon_group_id: string }) => 
      api.post('/addons/product-groups', params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-addon-groups'] }),
  });
}

export function useRemoveProductAddonGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { product_id: string; addon_group_id: string }) => 
      api.delete('/addons/product-groups', params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-addon-groups'] }),
  });
}

export function useProductAddons(productId: string) {
  return useQuery({
    queryKey: ['product-addons', productId],
    queryFn: async () => {
      return api.get<any[]>('/products/addons', { product_id: productId });
    },
    enabled: !!productId,
  });
}

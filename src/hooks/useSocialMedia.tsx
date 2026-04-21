import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SocialMedia {
  id: string;
  name: string;
  link: string;
  icon_url: string | null;
  is_active: boolean;
  display_order: number;
}

export function useSocialMedia() {
  return useQuery({
    queryKey: ['social-media'],
    queryFn: () => api.get<SocialMedia[]>('/social-media'),
  });
}

export function useCreateSocialMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SocialMedia>) => api.post<SocialMedia>('/social-media', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-media'] }),
  });
}

export function useUpdateSocialMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; data: Partial<SocialMedia> }) => 
      api.put<SocialMedia>(`/social-media/${params.id}`, params.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-media'] }),
  });
}

export function useDeleteSocialMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/social-media/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-media'] }),
  });
}

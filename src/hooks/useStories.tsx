import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Story {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  is_active: boolean;
  display_order: number;
  created_at: string;
  scheduled_at?: string | null;
  notification_sent?: boolean | number;
}

export function useStories(adminMode = false) {
  return useQuery({
    queryKey: ['stories', adminMode],
    queryFn: () => api.get<Story[]>('/stories'),
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Story>) => api.post<Story>('/stories', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useUpdateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Story> & { id: string }) =>
      api.put<Story>(`/stories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/stories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useReorderStories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { id: string; display_order: number }[]) =>
      api.put('/stories/reorder', { updates }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

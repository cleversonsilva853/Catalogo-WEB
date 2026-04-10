import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function getDayName(day: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[day] || '';
}

export interface BusinessHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
}

export function useBusinessHours() {
  return useQuery({
    queryKey: ['business-hours'],
    queryFn: () => api.get<BusinessHour[]>('/business-hours'),
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: BusinessHour[]) => api.put<BusinessHour[]>('/business-hours', hours),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-hours'] }),
  });
}

export function useUpdateBusinessHour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<BusinessHour> & { id: string }) => api.put<BusinessHour>(`/business-hours/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-hours'] }),
  });
}

export function useCreateBusinessHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/business-hours/create-default', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-hours'] }),
  });
}

export function useCreateBusinessHour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BusinessHour>) => api.post<BusinessHour>('/business-hours', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-hours'] }),
  });
}

export function useDeleteBusinessHour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/business-hours/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-hours'] }),
  });
}

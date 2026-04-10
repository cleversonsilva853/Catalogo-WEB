import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Ingredient {
  id: string;
  name: string;
  stock_quantity: number;
  unit: string;
  min_stock: number;
  created_at?: string;
  updated_at?: string;
}

export function useIngredients() {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: () => api.get<Ingredient[]>('/ingredients'),
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ingredient: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>) => 
      api.post<Ingredient>('/ingredients', ingredient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...update }: Partial<Ingredient> & { id: string }) => 
      api.put<Ingredient>(`/ingredients/${id}`, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ingredients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

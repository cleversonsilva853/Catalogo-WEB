import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, uploadFile } from '@/lib/api';

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  stock_type: 'unit' | 'ingredient';
  unit: string;
  stock_quantity: number;
  min_stock: number;
  category_name?: string;
}

export interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity_used: number;
  unit: string;
  ingredient?: { name: string; unit: string };
}

export function useProducts(filters?: { category_id?: string; is_available?: boolean }) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.category_id) params.category_id = filters.category_id;
      if (filters?.is_available !== undefined) params.is_available = String(filters.is_available);
      return api.get<Product[]>('/products', params);
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageFile, ...product }: Omit<Product, 'id'> & { imageFile?: File }) => {
      let image_url = product.image_url;
      if (imageFile) image_url = await uploadFile(imageFile);
      return api.post<Product>('/products', { ...product, image_url });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, imageFile, ...update }: Partial<Product> & { id: string; imageFile?: File }) => {
      if (imageFile) update.image_url = await uploadFile(imageFile);
      return api.put<Product>(`/products/${id}`, update);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useProductIngredients(productId?: string) {
  return useQuery({
    queryKey: ['product-ingredients', productId],
    queryFn: () => api.get<ProductIngredient[]>(`/products/${productId}/ingredients`),
    enabled: !!productId,
  });
}

export function useUpdateProductIngredients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ingredients }: { productId: string; ingredients: Omit<ProductIngredient, 'id' | 'product_id'>[] }) =>
      api.put(`/products/${productId}/ingredients`, { ingredients }),
    onSuccess: (_, { productId }) => queryClient.invalidateQueries({ queryKey: ['product-ingredients', productId] }),
  });
}

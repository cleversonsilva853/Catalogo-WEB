import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface StoreConfig {
  id: string;
  name: string;
  phone_whatsapp: string | null;
  pix_key: string | null;
  pix_key_type: string;
  logo_url: string | null;
  cover_url: string | null;
  cover_url_mobile: string | null;
  address: string | null;
  is_open: boolean;
  delivery_fee: number;
  min_order_value: number;
  delivery_time_min: number;
  delivery_time_max: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  menu_color?: string | null;
  pwa_name: string;
  pwa_short_name: string;
  pix_message: string | null;
  delivery_fee_mode: string;
  checkout_whatsapp_message: string | null;
  consume_on_site_enabled: boolean;
  subdomain_slug?: string | null;
  mode_delivery_enabled?: boolean;
  mode_pickup_enabled?: boolean;
  pickup_time_min?: number | null;
  pickup_time_max?: number | null;
  menu_layout?: string | null;
  hero_text_1?: string | null;
  hero_text_2?: string | null;
  hero_text_3?: string | null;
  hero_text_4?: string | null;
  hero_slogan?: string | null;
  hero_banner_enabled?: boolean | null;
  floating_image_enabled?: boolean | null;
  floating_image_url?: string | null;
  floating_image_size?: number | null;
  floating_image_position?: number | null;
  floating_image_vertical_position?: number | null;
  floating_image_size_mobile?: number | null;
  floating_image_position_mobile?: number | null;
  floating_image_vertical_position_mobile?: number | null;
  pdv_password?: string | null;
  kitchen_password?: string | null;
}

export function useStore() {
  return useQuery({
    queryKey: ['store'],
    queryFn: () => api.get<StoreConfig>('/store'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StoreConfig>) => api.put<StoreConfig>('/store', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store'] }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface CustomerAddress {
  id: string;
  customer_phone: string;
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string | null;
  reference: string | null;
  is_default: boolean;
  created_at: string;
}

export function useCustomerAddresses(phone: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['customer-addresses', phone],
    queryFn: () => {
      if (!phone || phone.length < 14) return [];
      return api.get<CustomerAddress[]>('/customer-addresses', { phone });
    },
    enabled: !!phone && phone.length >= 14,
  });

  const createAddress = useMutation({
    mutationFn: (address: Omit<CustomerAddress, 'id' | 'created_at'>) => {
      const isFirst = addresses.length === 0;
      return api.post<CustomerAddress>('/customer-addresses', { ...address, is_default: isFirst || address.is_default });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', phone] });
      toast({ title: 'Endereço salvo!' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar endereço', variant: 'destructive' });
    },
  });

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerAddress> }) => {
      return api.put(`/customer-addresses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', phone] });
      toast({ title: 'Endereço atualizado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: (id: string) => api.delete(`/customer-addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', phone] });
      toast({ title: 'Endereço removido!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    },
  });

  const setDefaultAddress = useMutation({
    mutationFn: (id: string) => api.put(`/customer-addresses/${id}`, { customer_phone: phone, is_default: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', phone] });
    },
  });

  return {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}

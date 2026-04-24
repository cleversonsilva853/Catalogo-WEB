import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useProducts, useUpdateProduct, Product } from '@/hooks/useProducts';
import { 
  Tag, 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  AlertCircle,
  TrendingDown,
  ChevronRight,
  Package
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Promotions() {
  const { toast } = useToast();
  const { data: products, isLoading } = useProducts();
  const updateProduct = useUpdateProduct();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Produtos que já estão em promoção (ou têm dados de promo preenchidos)
  const promoProducts = products?.filter(p => p.promo_price !== null && p.promo_price !== undefined) || [];
  
  // Filtrar produtos para o modal (aqueles que ainda NÃO estão na lista de promo)
  const availableProducts = products?.filter(p => 
    !promoProducts.find(pp => pp.id === p.id) &&
    p.name.toLowerCase().includes(modalSearchTerm.toLowerCase())
  ) || [];

  const handleAddProduct = async (product: Product) => {
    try {
      // Inicializa a promoção com o preço atual - 10% como sugestão ou apenas inicia zerado
      await updateProduct.mutateAsync({
        id: product.id,
        promo_price: product.price,
        is_promo_active: false
      });
      setIsModalOpen(false);
      setModalSearchTerm('');
      toast({ title: 'Produto adicionado!', description: 'Agora defina o preço promocional.' });
    } catch (e: any) {
      console.error(e);
      toast({ 
        title: 'Erro ao adicionar', 
        description: e.message || 'Verifique se as colunas promo_price e is_promo_active existem no banco.',
        variant: 'destructive' 
      });
    }
  };

  const handleRemovePromo = async (product: Product) => {
    if (!confirm(`Remover promoção de "${product.name}"?`)) return;
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        promo_price: null,
        is_promo_active: false
      });
      toast({ title: 'Promoção removida.' });
    } catch (e) {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    }
  };

  const handleUpdatePrice = async (product: Product, newPrice: string) => {
    const price = parseFloat(newPrice.replace(',', '.'));
    if (isNaN(price)) return;

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        promo_price: price
      });
    } catch (e) {
      toast({ title: 'Erro ao salvar preço', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        is_promo_active: !product.is_promo_active
      });
      toast({ title: product.is_promo_active ? 'Promoção desativada' : 'Promoção ativada!' });
    } catch (e) {
      toast({ title: 'Erro ao alternar status', variant: 'destructive' });
    }
  };

  const filteredPromos = promoProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Promoções">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Promoções Ativas</h2>
              <p className="text-xs text-slate-500">Gerencie descontos e ofertas especiais</p>
            </div>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white border-slate-200 text-slate-900 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Selecionar Produto
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar produto..." 
                    className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary/50"
                    value={modalSearchTerm}
                    onChange={e => setModalSearchTerm(e.target.value)}
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {availableProducts.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum produto disponível</p>
                    </div>
                  ) : (
                    availableProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group"
                      >
                          <div className="flex items-center gap-3">
                          {p.image_url && (
                             <img src={p.image_url} className="h-10 w-10 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-500">Preço atual: {Number(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-3 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleAddProduct(p)}
                        >
                          Adicionar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filter */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Filtrar promoções já adicionadas..." 
            className="pl-12 h-12 bg-white border-slate-200 rounded-2xl text-slate-900 shadow-sm placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Promotion List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          </div>
        ) : filteredPromos.length === 0 ? (
          <Card className="bg-white border-dashed border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Tag className="h-12 w-12 mb-4 opacity-20" />
              <p>Nenhuma promoção configurada.</p>
              <p className="text-xs text-slate-500">Clique em "Adicionar Produto" para começar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPromos.map(p => (
              <Card key={p.id} className={cn(
                "admin-card transition-all duration-300 border-white/5 overflow-hidden",
                p.is_promo_active ? "border-primary/20 bg-primary/5" : "opacity-80"
              )}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center p-4 gap-6">
                    {/* Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                        {p.image_url ? (
                          <img src={p.image_url} className="h-full w-full object-cover rounded-2xl shadow-lg shadow-black/20" />
                        ) : (
                          <div className="h-full w-full rounded-2xl bg-white/5 flex items-center justify-center">
                            <Package className="h-8 w-8 text-white/10" />
                          </div>
                        )}
                        {p.is_promo_active && (
                          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg animate-pulse">
                            <Tag className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Badge variant="outline" className="mb-1 text-[10px] border-slate-200 text-slate-500 font-normal">
                          {p.category_name || 'Produto'}
                        </Badge>
                        <h4 className="font-bold text-lg text-slate-900 truncate leading-none">{p.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                      </div>
                    </div>

                    {/* Pricing Controls */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-8 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Preço Atual</span>
                        <span className="text-sm font-medium text-slate-500 line-through">
                          {Number(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-[120px]">
                        <Label className="text-[10px] uppercase font-extrabold tracking-wider text-primary mb-1">Preço Promo</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                          <Input 
                            type="number"
                            step="0.01"
                            defaultValue={p.promo_price}
                            onBlur={(e) => handleUpdatePrice(p, e.target.value)}
                            className="pl-8 h-9 bg-white border-slate-200 text-slate-900 font-bold text-sm focus:ring-primary/50"
                          />
                        </div>
                      </div>

                      <div className="h-8 w-px bg-white/10 hidden sm:block" />

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                          <span className={cn("text-xs font-bold", p.is_promo_active ? "text-primary" : "text-slate-400")}>
                            {p.is_promo_active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                        <Switch 
                          checked={p.is_promo_active} 
                          onCheckedChange={() => handleToggleActive(p)}
                          className="mr-2"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-slate-300 hover:text-destructive hover:bg-destructive/10 transition-colors border border-slate-200"
                          onClick={() => handleRemovePromo(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

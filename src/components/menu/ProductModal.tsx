import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useProductAddons, AddonGroup, AddonOption } from '@/hooks/useAddons';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  initialQuantity?: number;
  initialObservation?: string;
  initialAddons?: Record<string, string[]>;
  isEditing?: boolean;
  returnTo?: string | null;
}

interface AddonGroupWithOptions extends AddonGroup {
  options: AddonOption[];
}

export function ProductModal({
  product,
  onClose,
  initialQuantity = 1,
  initialObservation = '',
  initialAddons,
  isEditing = false,
  returnTo = null,
}: ProductModalProps) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [observation, setObservation] = useState(initialObservation);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, string[]>>(initialAddons || {});
  const { addItem, removeItem } = useCart();
  const { toast } = useToast();
  
  const { data: addonGroups, isLoading: addonsLoading } = useProductAddons(product.id);

  // Block body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Initialize selected add-ons when data loads (only if not editing with pre-selected addons)
  useEffect(() => {
    // Only initialize if we have addonGroups and no initialAddons were provided (new item)
    // AND if we haven't already initialized (selectedAddOns is mostly empty)
    if (addonGroups && !initialAddons && Object.keys(selectedAddOns).length === 0) {
      const initial: Record<string, string[]> = {};
      addonGroups.forEach((group: AddonGroupWithOptions) => {
        if (group.is_required && group.options.length > 0) {
          initial[group.id] = [group.options[0].id];
        } else {
          initial[group.id] = [];
        }
      });
      setSelectedAddOns(initial);
    }
  }, [addonGroups, initialAddons]);

  // Calculate add-ons total
  const addOnsTotal = useMemo(() => {
    if (!addonGroups) return 0;
    
    let total = 0;
    addonGroups.forEach((group: AddonGroupWithOptions) => {
      const selected = selectedAddOns[group.id] || [];
      selected.forEach(optionId => {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          total += Number(option.price);
        }
      });
    });
    return total;
  }, [addonGroups, selectedAddOns]);

  const basePrice = Number(product.price);
  const unitPrice = basePrice + addOnsTotal;
  const totalPrice = (unitPrice * quantity).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  const formattedPrice = basePrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [groupId]: [optionId]
    }));
  };

  const handleMultiSelect = (groupId: string, optionId: string, maxSelections: number) => {
    setSelectedAddOns(prev => {
      const current = prev[groupId] || [];
      const isSelected = current.includes(optionId);
      
      if (isSelected) {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
      
      // If max selections reached and limit is 1, replace the current one
      if (maxSelections === 1) {
        return { ...prev, [groupId]: [optionId] };
      }
      
      // If within limit, add it
      if (current.length < maxSelections) {
        return { ...prev, [groupId]: [...current, optionId] };
      }
      
      return prev;
    });
  };

  const handleAddToCart = () => {
    // Validate required addons
    const missingRequired = addonGroups?.filter(g => 
      g.is_required && (!selectedAddOns[g.id] || selectedAddOns[g.id].length === 0)
    ) || [];

    if (missingRequired.length > 0) {
      toast({
        title: "Seleção obrigatória",
        description: `Por favor, selecione as opções obrigatórias: ${missingRequired.map(g => g.title).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    if (isEditing) {
      removeItem(product.id);
    }

    addItem(
      {
        id: product.id,
        category_id: product.category_id || '',
        name: product.name,
        description: product.description || '',
        price: unitPrice, // Price with add-ons
        image_url: product.image_url || '',
        is_available: product.is_available,
      },
      quantity,
      observation.trim() ? observation.trim() : undefined,
      selectedAddOns
    );

    if (isEditing && returnTo) {
      navigate(`/${returnTo}`);
    } else {
      onClose();
    }
  };

  const hasAddons = addonGroups && addonGroups.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 backdrop-blur-sm sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up bg-background sm:rounded-3xl sm:m-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image Header with Close Button */}
          <div className="relative w-full overflow-hidden" style={{ height: '300px' }}>
            {product.image_url ? (
              <>
                {/* Blurred background image */}
                <img
                  src={product.image_url}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-[1.2]"
                  style={{ filter: 'blur(30px)' }}
                />
                {/* Dark overlay for contrast */}
                <div className="absolute inset-0 bg-foreground/20" />
                {/* Main product image */}
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="relative z-10 max-h-[220px] rounded-2xl object-contain"
                  style={{ 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <span className="text-6xl">🍔</span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="absolute left-3 top-3 h-9 w-9 rounded-full bg-foreground/80 text-background hover:bg-foreground z-20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Product Info */}
          <div className="px-5 py-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-slate-800 leading-tight">{product.name}</h2>
            <p className="mt-1.5 text-2xl sm:text-3xl font-bold text-primary">
              {formattedPrice}
            </p>
            
            {product.description && (
              <div className="mt-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Descrição</h3>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Quantity Section - Moved out of footer */}
          <div className="px-5 mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Quantidade</h3>
            <div className="flex items-center gap-5">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[14px] bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                aria-label="Diminuir"
              >
                <span className="text-3xl font-medium leading-none mb-1">-</span>
              </button>
              <span className="text-xl sm:text-2xl font-bold w-4 text-center text-slate-800">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[14px] bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                aria-label="Aumentar"
              >
                <span className="text-3xl font-medium leading-none mb-1">+</span>
              </button>
            </div>
          </div>

          {/* Add-ons Sections */}
          {addonsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : hasAddons ? (
            addonGroups.map((group: AddonGroupWithOptions) => (
              <div key={group.id} className="px-5 mb-8">
                {/* Section Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">{group.title}</h3>
                    {group.is_required && (
                      <span className="text-[10px] sm:text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md uppercase">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  {group.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.subtitle}
                    </p>
                  )}
                </div>
                
                {/* Options */}
                {group.max_selections === 1 && group.is_required ? (
                  <RadioGroup 
                    value={selectedAddOns[group.id]?.[0] || ''} 
                    onValueChange={(value) => handleSingleSelect(group.id, value)} 
                    className="space-y-3"
                  >
                    {group.options.map((option) => {
                      const isSelected = selectedAddOns[group.id]?.[0] === option.id;
                      return (
                      <Label 
                        key={option.id}
                        htmlFor={`${group.id}-${option.id}`} 
                        className={`flex items-center w-full p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${isSelected ? 'border-primary bg-primary/5' : 'border-border/60 bg-card hover:border-primary/30'}`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mr-3 ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <span className="text-lg leading-none mb-0.5 font-medium">+</span>}
                        </div>
                        <span className="flex-1 font-medium text-sm sm:text-base text-slate-800 select-none">{option.name}</span>
                        {Number(option.price) > 0 && (
                          <span className={`font-bold text-sm select-none ${isSelected ? 'text-primary' : 'text-primary'}`}>
                            + {Number(option.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                        <RadioGroupItem value={option.id} id={`${group.id}-${option.id}`} className="sr-only" />
                      </Label>
                    )})}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {group.options.map((option) => {
                      const isSelected = selectedAddOns[group.id]?.includes(option.id) || false;
                      return (
                        <Label 
                          key={option.id}
                          htmlFor={`${group.id}-${option.id}`} 
                          className={`flex items-center w-full p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${isSelected ? 'border-primary bg-primary/5' : 'border-border/60 bg-card hover:border-primary/30'}`}
                        >
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mr-3 ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <span className="text-lg leading-none mb-0.5 font-medium">+</span>}
                          </div>
                          <span className="flex-1 font-medium text-sm sm:text-base text-slate-800 select-none">{option.name}</span>
                          {Number(option.price) > 0 && (
                            <span className="text-primary font-bold text-sm select-none">
                              + {Number(option.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          )}
                          <Checkbox
                            id={`${group.id}-${option.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleMultiSelect(group.id, option.id, group.max_selections)}
                            className="sr-only"
                          />
                        </Label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : null}

          {/* Observation */}
          <div className="px-5 mb-10">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">
              Observações do pedido
            </h3>
            <Textarea 
              placeholder="Ex: sem cebola, pouco molho, carne bem passada" 
              value={observation} 
              onChange={e => setObservation(e.target.value)} 
              className="resize-none rounded-2xl bg-card border border-border/60 text-sm sm:text-base p-4 min-h-[100px] shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 font-medium placeholder:text-slate-400" 
              rows={3} 
            />
          </div>
        </div>

        {/* Footer - Add Button */}
        <div className="shrink-0 bg-background p-4 sm:p-5 border-t border-border shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-10 safe-area-bottom">
          <button 
            onClick={handleAddToCart} 
            className="w-full relative flex items-center justify-between rounded-[16px] bg-primary px-6 py-4 sm:py-5 text-white hover:bg-primary/95 transition-all shadow-md active:scale-[0.98]" 
          >
            <span className="font-bold text-base sm:text-lg">{isEditing ? 'Atualizar carrinho' : 'Adicionar ao carrinho'}</span>
            <span className="font-bold text-base sm:text-lg">{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

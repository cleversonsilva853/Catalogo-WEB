import { Plus } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface MenuProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function MenuProductCard({ product, onSelect }: MenuProductCardProps) {
  const formattedPrice = Number(product.price).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div
      className={cn(
        "group relative flex gap-4 rounded-[28px] bg-card p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.08)] transition-all duration-300 border-[1.5px] border-border/50",
        product.is_available 
          ? "cursor-pointer hover:shadow-[0_0_25px_rgba(0,0,0,0.15)] hover:border-primary/40 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]" 
          : "opacity-60"
      )}
      onClick={() => product.is_available && onSelect(product)}
    >
      {/* Content */}
      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="pr-2">
          <h4 className="font-bold text-lg text-foreground leading-tight">{product.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>
        <div className="flex items-center mt-3">
          <span className="text-lg font-extrabold text-primary">{formattedPrice}</span>
        </div>
      </div>

      {/* Image Block */}
      {product.image_url && (
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-[20px] shadow-sm ml-auto">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {!product.is_available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-[10px] font-bold uppercase text-white">Esgotado</span>
            </div>
          )}
          {/* Add Button - Overlapping Image */}
          {product.is_available && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm text-primary shadow-md transition-all hover:scale-110 active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
            </button>
          )}
        </div>
      )}

      {/* Add Button - Fallback se não tiver imagem */}
      {!product.image_url && product.is_available && (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm transition-all duration-200"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

import { useIngredients } from '@/hooks/useIngredients';
import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function GlobalStockNotification() {
  const { data: ingredients } = useIngredients();
  const { data: settings } = useSystemSettings();
  const [closed, setClosed] = useState(false);

  // Considera itens com menos de 50% do estoque mínimo
  const criticalCount = ingredients?.filter(ing => 
    ing.min_stock > 0 && ing.stock_quantity <= (ing.min_stock * 0.5)
  ).length || 0;

  useEffect(() => {
    // Se o número de itens críticos aumentar, reabre o aviso
    if (criticalCount > 0) {
      setClosed(false);
    }
  }, [criticalCount]);

  if (!settings?.stock_enabled || criticalCount === 0 || closed) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
      <Link to="/admin/ingredients" className="flex items-center gap-2 flex-1 hover:underline decoration-white/30 underline-offset-4">
        <AlertTriangle className="h-4 w-4 animate-pulse" />
        <span className="text-xs sm:text-sm font-medium">
          Atenção: {criticalCount} {criticalCount === 1 ? 'item está' : 'itens estão'} com nível de estoque crítico (abaixo de 50%).
        </span>
      </Link>
      <button 
        onClick={() => setClosed(true)}
        className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

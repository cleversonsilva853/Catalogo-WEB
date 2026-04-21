import { useState } from 'react';
import { Category } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { ChefHat, Utensils } from 'lucide-react';

interface CategoryIconsProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
}

export function CategoryIcons({ categories, onCategorySelect }: CategoryIconsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (categoryId: string | null) => {
    setSelectedId(categoryId);
    if (categoryId) {
      onCategorySelect(categoryId);
    } else {
      // Scroll to top for "Todos"
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mt-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-foreground">Categorias</h3>
      </div>
      
      <div className="flex gap-3 pb-4 overflow-x-auto scrollbar-hide snap-x">
        {/* Option: Todos */}
        <button
          onClick={() => handleSelect(null)}
          className={cn(
            "flex flex-col items-center justify-center min-w-[85px] h-[85px] rounded-[24px] transition-all duration-300 snap-start gap-1",
            selectedId === null
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "bg-card text-muted-foreground border border-border/50 hover:border-primary/30"
          )}
        >
          <ChefHat className={cn("h-7 w-7", selectedId === null ? "text-white" : "text-primary")} />
          <span className="text-xs font-bold">Todos</span>
        </button>

        {/* Categories from DB */}
        {categories.map((category) => {
          const isSelected = selectedId === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[85px] h-[85px] rounded-[24px] transition-all duration-300 snap-start gap-1",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                  : "bg-card text-muted-foreground border border-border/50 hover:border-primary/30"
              )}
            >
              {category.image_url ? (
                <img 
                  src={category.image_url} 
                  alt={category.name} 
                  className={cn("h-7 w-7 object-contain", isSelected ? "brightness-0 invert" : "")} 
                />
              ) : (
                <Utensils className={cn("h-6 w-6", isSelected ? "text-white" : "text-primary")} />
              )}
              <span className="text-xs font-bold truncate w-full px-2">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

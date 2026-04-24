import { useRef } from 'react';
import { Category } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { ChefHat, Utensils } from 'lucide-react';

interface CategoryIconsProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryIcons({ categories, selectedId, onSelect }: CategoryIconsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (categoryId: string | null, event: React.MouseEvent<HTMLButtonElement>) => {
    onSelect(categoryId);
    
    // Auto-scroll logic to center the clicked item
    const button = event.currentTarget;
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;

      // Calculate target so the button is centered in the container
      const targetScroll = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mt-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-foreground">Categorias</h3>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 pb-4 overflow-x-auto scrollbar-hide snap-x scroll-smooth md:justify-center md:overflow-visible md:flex-wrap"
      >
        {/* Option: Todos */}
        <button
          onClick={(e) => handleSelect(null, e)}
          className={cn(
            "flex flex-col items-center justify-center min-w-[85px] h-[85px] rounded-[24px] transition-all duration-300 snap-start gap-1 flex-shrink-0",
            selectedId === null
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "bg-card text-muted-foreground border-[1.5px] border-border/60 hover:border-primary/30"
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
              onClick={(e) => handleSelect(category.id, e)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[85px] h-[85px] rounded-[24px] transition-all duration-300 snap-start gap-1 flex-shrink-0",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                  : "bg-card text-muted-foreground border-[1.5px] border-border/60 hover:border-primary/30"
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

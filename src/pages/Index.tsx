import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HeroHeader } from '@/components/menu/HeroHeader';
import { StoreInfo } from '@/components/menu/StoreInfo';
import { CategoryIcons } from '@/components/menu/CategoryIcons';
import { CategoryGrid } from '@/components/menu/CategoryGrid';
import { MenuSection } from '@/components/menu/MenuSection';
import { MenuProductCard } from '@/components/menu/MenuProductCard';
import { ProductModal } from '@/components/menu/ProductModal';
import { CartButton } from '@/components/cart/CartButton';
import { FloatingOrderButton, getLastOrderId } from '@/components/order/FloatingOrderButton';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { InfornexaBanner } from '@/components/menu/InfornexaBanner';
import { useStore } from '@/hooks/useStore';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useCategories } from '@/hooks/useCategories';
import { useProducts, Product } from '@/hooks/useProducts';
import { useTheme } from '@/hooks/useTheme';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { useSocialMedia } from '@/hooks/useSocialMedia';
import { useStories } from '@/hooks/useStories';
import { usePublicPush } from '@/hooks/usePublicPush';

import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface EditingProduct {
  product: Product;
  quantity: number;
  observation: string;
  returnTo: string | null;
  selectedAddons?: Record<string, string[]>;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDineInMode = searchParams.get('mode') === 'dine_in';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: store, isLoading: storeLoading } = useStore();
  const { data: systemSettings } = useSystemSettings();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: socialMedia } = useSocialMedia();
  const { data: stories } = useStories();
  const storeStatus = useStoreStatus();

  // Register public push subscription (silent, customers who already granted permission)
  usePublicPush();

  // Apply dynamic theme based on store colors
  useTheme();

  const isMenuLoading = categoriesLoading || productsLoading;

  // Check for last order on mount
  useEffect(() => {
    const orderId = getLastOrderId();
    setLastOrderId(orderId);
  }, []);

  // Block dine_in mode access when consume_on_site_enabled is false
  useEffect(() => {
    if (isDineInMode && systemSettings && systemSettings.consume_on_site_enabled === false) {
      // Remove mode param and redirect to main menu
      setSearchParams({}, { replace: true });
    }
  }, [isDineInMode, systemSettings, setSearchParams]);

  // Handle URL params for editing products from cart/checkout
  useEffect(() => {
    const productId = searchParams.get('product');
    const rawObservation = searchParams.get('observation') || '';
    const quantity = parseInt(searchParams.get('quantity') || '1', 10);
    const returnTo = searchParams.get('returnTo');
    const addonsParam = searchParams.get('addons');

    const sanitizeObservation = (value: string) => {
      const v = value.trim();
      if (!v) return '';

      // Legacy format previously stored: "Adicionais: ... | Obs: ..."
      const obsMarker = 'Obs:';
      if (v.includes(obsMarker)) {
        const idx = v.lastIndexOf(obsMarker);
        const extracted = v.slice(idx + obsMarker.length).trim();
        return extracted;
      }

      // If it only contains legacy addons text, drop it
      if (v.startsWith('Adicionais:')) return '';

      return v;
    };

    if (productId && products) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        let selectedAddons: Record<string, string[]> | undefined;
        if (addonsParam) {
          try {
            selectedAddons = JSON.parse(decodeURIComponent(addonsParam));
          } catch (e) {
            console.error('Error parsing addons:', e);
          }
        }

        setEditingProduct({
          product,
          quantity,
          observation: sanitizeObservation(rawObservation),
          returnTo,
          selectedAddons,
        });
        // Clear the URL params
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, products, setSearchParams]);

  const scrollToCategory = (categoryId: string) => {
    const element = sectionRefs.current[categoryId];
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    // If we FILTER, it's better to stay in the menu context or scroll to the results
    // but the user specifically asked NOT to scroll to the top of the page.
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setEditingProduct(null);
  };

  if (storeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-4">Restaurante não configurado</p>
          <a 
            href="/auth" 
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Configurar Restaurante
          </a>
        </div>
      </div>
    );
  }

  // Filter products by search
  const filteredSearchProducts = products?.filter(product => 
    searchQuery === '' || 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  ) || [];

  // Group products by category AND filter by selected category
  const productsByCategory = categories?.filter(cat => 
    selectedCategoryId === null || cat.id === selectedCategoryId
  ).map(category => ({
    category,
    products: filteredSearchProducts.filter(p => p.category_id === category.id)
  })).filter(group => group.products.length > 0) || [];

  const totalItems = filteredSearchProducts.length;
  const menuLayout = store?.menu_layout || 'list';
  const isCategoryMode = menuLayout === 'category';
  // Determine which modal to show
  const modalProduct = editingProduct?.product || selectedProduct;
  const isEditing = !!editingProduct;

  return (
    <>
      <Helmet>
        <title>{store.name} - Cardápio Digital</title>
        <meta name="description" content={`Peça online no ${store.name}. Lanches, bebidas e muito mais com entrega rápida.`} />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Hero Header */}
        <HeroHeader store={store} socialMedia={socialMedia} stories={stories} />


        {/* Categories & Products - Conditional Layout */}
        <div data-menu-section="true" className="relative z-20 -mt-10 pt-4 pb-10 bg-background rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] min-h-[50vh]">
          {/* Store Info */}
          <StoreInfo store={store} />

          {/* Inline Install Banner for Mobile */}
          <InstallPrompt inline />

          {isMenuLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-4 flex items-center text-lg text-muted-foreground">Carregando cardápio...</p>
            </div>
          ) : isCategoryMode ? (
          <>
            {/* Search Bar */}
            <div className="px-4 mt-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Procurar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-card pl-4 pr-12 shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
                <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="pt-4">
              {searchQuery ? (
                /* When searching, show products in list mode */
                <div className="px-4 pb-32 space-y-3">
                  <h2 className="text-lg font-bold text-foreground mb-3">Resultados</h2>
                  {filteredSearchProducts.length > 0 ? (
                    filteredSearchProducts.map((product) => (
                      <MenuProductCard
                        key={product.id}
                        product={product}
                        onSelect={setSelectedProduct}
                      />
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">Nenhum produto encontrado</p>
                    </div>
                  )}
                </div>
              ) : (
                <CategoryGrid
                  categories={categories || []}
                  products={products || []}
                  onProductSelect={setSelectedProduct}
                />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Search Bar */}
            <div className="px-4 mt-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Procurar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-card pl-4 pr-12 shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
                <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Categories */}
            {categories && categories.length > 0 && (
              <CategoryIcons 
              categories={categories} 
              selectedId={selectedCategoryId}
              onSelect={handleCategorySelect}
            />
            )}


            {/* Selected Category Name Display - Only show when all categories are visible */}
            {selectedCategoryId === null && (
              <div className="px-4 mt-6 mb-2">
                <h2 className="text-xl font-bold text-foreground text-primary">Todas categorias</h2>
              </div>
            )}

            {/* Menu Sections */}
            <div className="px-4 space-y-6">
              {productsByCategory.map(({ category, products }) => (
                <MenuSection
                  key={category.id}
                  ref={(el) => { sectionRefs.current[category.id] = el; }}
                  category={category}
                  products={products}
                  onProductSelect={setSelectedProduct}
                />
              ))}

              {productsByCategory.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
                  </p>
                  {!searchQuery && store.name === 'Meu Restaurante' && (
                    <a 
                      href="/admin" 
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Acessar Painel Admin
                    </a>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        </div>

        {/* Infornexa Advertisement Banner */}
        <InfornexaBanner />

        {/* PWA Install Prompt */}
        <InstallPrompt />

        <CartButton />
        
        {modalProduct && (
          <ProductModal
            product={modalProduct}
            onClose={handleCloseModal}
            initialQuantity={editingProduct?.quantity}
            initialObservation={editingProduct?.observation}
            initialAddons={editingProduct?.selectedAddons}
            isEditing={isEditing}
            returnTo={editingProduct?.returnTo}
          />
        )}
      </div>
    </>
  );
};

export default Index;

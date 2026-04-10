import { useNavigate } from 'react-router-dom';
import { ClipboardList, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

const ORDER_STORAGE_KEY = 'last_order_id';

export function saveLastOrderId(orderId: number) {
  localStorage.setItem(ORDER_STORAGE_KEY, String(orderId));
}

export function getLastOrderId(): number | null {
  const id = localStorage.getItem(ORDER_STORAGE_KEY);
  return id ? Number(id) : null;
}

export function clearLastOrderId() {
  localStorage.removeItem(ORDER_STORAGE_KEY);
}

interface FloatingOrderButtonProps {
  orderId: number;
  onDismiss?: () => void;
}

export function FloatingOrderButton({ orderId, onDismiss }: FloatingOrderButtonProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  // Subscribe to order status changes and hide when completed
  useEffect(() => {
    // Check initial status
    const checkOrderStatus = async () => {
        const [data] = await api.get<any[]>(`/orders?id=${orderId}`);
      
      if (data?.status === 'completed' || data?.status === 'cancelled') {
        handleDismiss();
      }
    };

    checkOrderStatus();

    const interval = setInterval(checkOrderStatus, 10000); // Poll a cada 10s

    return () => clearInterval(interval);
  }, [orderId]);

  const handleDismiss = () => {
    setIsVisible(false);
    clearLastOrderId();
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-1">
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-md"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      
      {/* Order button */}
      <Button
        onClick={() => navigate(`/order/${orderId}`)}
        className="h-14 w-14 rounded-full shadow-lg animate-bounce-subtle"
        size="icon"
      >
        <ClipboardList className="h-6 w-6" />
      </Button>
    </div>
  );
}

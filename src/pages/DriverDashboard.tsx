import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LogOut, Loader2, Truck, MapPin, Phone, User, CreditCard, Navigation, Play, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PushNotificationToggle } from '@/components/admin/PushNotificationToggle';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { usePWAConfig } from '@/hooks/usePWAConfig';
import { useDriverOrders, useDriverOrderItems, useUpdateDriverOrderStatus } from '@/hooks/useDrivers';
import { useDriverNotifications } from '@/hooks/useDriverNotifications';
import { useServiceWorkerPush } from '@/hooks/useServiceWorkerPush';
import { useAutoPromptPush } from '@/hooks/useAutoPromptPush';
import { toast } from 'sonner';

function DriverOrderCard({ order, isNew, onAcknowledge }: { order: any; isNew: boolean; onAcknowledge: (id: number) => void }) {
  const { data: items } = useDriverOrderItems(order.id);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatCurrency = (value: number) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const paymentLabels: Record<string, string> = {
    pix: '💠 PIX',
    money: '💵 Dinheiro',
    card: '💳 Cartão',
    credit: '💳 Crédito',
    debit: '💳 Débito',
  };

  const updateStatus = useUpdateDriverOrderStatus();

  const handleStartDelivery = async () => {
    setIsUpdating(true);
    try {
      await updateStatus.mutateAsync({ 
        orderId: order.id, 
        status: 'delivery' 
      });
      onAcknowledge(order.id);
      toast.success('Entrega iniciada!');
    } catch (err: any) {
      toast.error('Erro ao iniciar entrega');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinishDelivery = async () => {
    setIsUpdating(true);
    try {
      await updateStatus.mutateAsync({ 
        orderId: order.id, 
        status: 'completed' 
      });
      toast.success('Entrega finalizada!');
    } catch (err: any) {
      toast.error('Erro ao finalizar entrega');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className={`rounded-2xl overflow-hidden shadow-card transition-all border-l-4 ${
      order.status === 'delivery' ? 'border-l-purple-600' : 'border-l-orange-500'
    } ${isNew ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : 'border-border/40'}`}>
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Order Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Truck className={`h-5 w-5 sm:h-6 sm:w-6 ${order.status === 'delivery' ? 'text-purple-600' : 'text-orange-600'}`} />
            <h3 className="font-bold text-lg sm:text-2xl text-foreground">Pedido #{order.id}</h3>
          </div>
          <Badge 
            variant={order.status === 'ready' ? 'secondary' : 'default'} 
            className={`text-xs px-3 py-1 font-bold ${order.status === 'delivery' ? 'bg-purple-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-100'}`}
          >
            {order.status === 'ready' ? 'Pronto' : 'Em Entrega'}
          </Badge>
        </div>

        {/* Customer & Address Section */}
        <div className="space-y-3 bg-muted/30 p-3 rounded-xl border border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold text-foreground text-sm sm:text-base">{order.customer_name}</span>
            </div>
            {order.customer_phone && (
              <a 
                href={`tel:${order.customer_phone}`} 
                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200"
              >
                <Phone className="h-3 w-3" />
                Ligar
              </a>
            )}
          </div>
          
          <div className="flex gap-2 border-t border-border/10 pt-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base leading-tight break-words">
                {order.address_street}, {order.address_number}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[order.address_neighborhood, order.address_complement].filter(Boolean).join(' - ')}
              </p>
              {order.address_reference && (
                <p className="text-xs text-warning font-medium mt-1">📍 {order.address_reference}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: Google Maps */}
        {order.latitude && order.longitude && (
          <Button
            variant="outline"
            className="w-full h-10 border-2 border-primary/20 text-primary hover:bg-primary/5 text-xs font-bold uppercase gap-2 rounded-xl"
            onClick={() => {
              const lat = Number(order.latitude);
              const lng = Number(order.longitude);
              window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
            }}
          >
            <Navigation className="h-4 w-4" />
            Abrir no Google Maps
          </Button>
        )}

        {/* Items List - Compact Card Style */}
        <div className="border-y border-border/20 py-3 my-2 space-y-1.5">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Itens do Pedido
          </p>
          <div className="grid grid-cols-1 gap-1">
            {items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-foreground font-medium flex-1">
                  <span className="font-bold text-primary mr-2">{item.quantity}x</span>
                  {item.product_name}
                </span>
                {item.observation && (
                  <Badge variant="outline" className="text-[10px] bg-orange-50/50 border-orange-200">
                    Obs
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Payment & Total */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Pagamento</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <CreditCard className="h-3 w-3 text-muted-foreground" />
              <span>{paymentLabels[order.payment_method] || order.payment_method}</span>
            </div>
            {order.payment_method === 'money' && order.change_for && (
              <span className="text-[11px] font-bold text-green-600 bg-green-50 px-1.5 rounded-md self-start mt-0.5">
                Troco p/ {formatCurrency(order.change_for)}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block text-right opacity-70">Total</span>
            <span className="text-xl sm:text-3xl font-black text-foreground">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        {/* Major Status Buttons */}
        <div className="pt-2">
          {order.status === 'ready' && (
            <Button 
              className="w-full h-12 gap-2 text-base font-black uppercase tracking-wider bg-orange-500 hover:bg-orange-600 shadow-orange-200 shadow-lg"
              onClick={handleStartDelivery} 
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
              Iniciar Entrega
            </Button>
          )}
          {order.status === 'delivery' && (
            <Button 
              className="w-full h-14 gap-2 text-lg font-black uppercase tracking-wider bg-green-600 hover:bg-green-700 shadow-green-200 shadow-lg"
              onClick={handleFinishDelivery} 
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle className="h-6 w-6" />}
              Finalizar Entrega
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { data: store } = useStore();

  useTheme();
  usePWAConfig();

  const driverId = localStorage.getItem('driver_id');
  const driverName = localStorage.getItem('driver_name');

  const { data: orders, isLoading } = useDriverOrders(driverId);
  const { newOrderIds, acknowledgeOrder, permissionGranted, requestPermission } = useDriverNotifications(orders);

  // Listen for push notifications from SW to play alarm in foreground
  useServiceWorkerPush();

  // Auto-prompt push permission for driver
  useAutoPromptPush('driver', driverId);

  useEffect(() => {
    if (!driverId || !driverName) {
      navigate('/driver');
    }
  }, [driverId, driverName, navigate]);

  // Web Push and notifications are handled via hooks already

  const handleLogout = () => {
    localStorage.removeItem('driver_id');
    localStorage.removeItem('driver_name');
    localStorage.removeItem('driver_seen_order_ids');
    navigate('/driver');
  };

  const readyOrders = orders?.filter((o: any) => o.status === 'ready') || [];
  const deliveryOrders = orders?.filter((o: any) => o.status === 'delivery') || [];

  return (
    <>
      <Helmet>
        <title>{`Entregadores - ${store?.name || 'Restaurante'}`}</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-foreground">Olá, {driverName}!</h1>
              <p className="text-sm text-muted-foreground">{store?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <PushNotificationToggle variant="button" userType="driver" userIdentifier={driverId} />
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="bg-orange-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{readyOrders.length}</p>
            <p className="text-xs text-orange-600">Aguardando</p>
          </div>
          <div className="bg-purple-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{deliveryOrders.length}</p>
            <p className="text-xs text-purple-600">Em Entrega</p>
          </div>
        </div>

        {/* Orders */}
        <div className="px-4 pb-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (!orders || orders.length === 0) ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Truck className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-xl text-muted-foreground">Nenhuma entrega no momento</p>
              <p className="text-sm text-muted-foreground mt-2">Quando um pedido for atribuído a você, ele aparecerá aqui</p>
            </div>
          ) : (
            <>
              {deliveryOrders.length > 0 && (
                <div>
                  <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-purple-600" /> Em Entrega
                  </h2>
                  <div className="space-y-3">
                    {deliveryOrders.map((order: any) => (
                      <DriverOrderCard key={order.id} order={order} isNew={false} onAcknowledge={acknowledgeOrder} />
                    ))}
                  </div>
                </div>
              )}
              {readyOrders.length > 0 && (
                <div>
                  <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600" /> Aguardando Retirada
                  </h2>
                  <div className="space-y-3">
                    {readyOrders.map((order: any) => (
                      <DriverOrderCard key={order.id} order={order} isNew={newOrderIds.has(order.id)} onAcknowledge={acknowledgeOrder} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

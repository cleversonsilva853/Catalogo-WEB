import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  PackageCheck, 
  Loader2, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDriver, useDriverReportOrders } from '@/hooks/useDrivers';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export default function DriverReport() {
  const navigate = useNavigate();
  const driverId = localStorage.getItem('driver_id');
  const { data: store } = useStore();
  const { data: driver } = useDriver(driverId);
  const { data: orders, isLoading } = useDriverReportOrders(driverId);
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  useTheme();

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= monthStart && orderDate <= monthEnd && order.status === 'completed';
    });
  }, [orders, selectedDate]);

  const stats = useMemo(() => {
    const totalDeliveries = filteredOrders.length;
    const totalReceived = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const commissionRate = (driver?.commission_percentage || 0) / 100;
    
    // Check if commission is a flat fee (like R$ 5,00) or percentage
    // In this system, commission_percentage is used as R$ value in some places
    // Let's check how it's used in AdminDriverReports.tsx:
    // line 67: Number(driver.commission_percentage ?? 0).toFixed(2)
    // Actually, in PHP it's just a number. 
    // Let's assume it's a FIXED VALUE per delivery as requested previously for "Valor (R$)"
    const totalCommission = totalDeliveries * (driver?.commission_percentage || 0);

    return {
      totalDeliveries,
      totalReceived,
      totalCommission
    };
  }, [filteredOrders, driver]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const nextMonth = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const prevMonth = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/driver/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg text-foreground">Meu Relatório</h1>
            <p className="text-xs text-muted-foreground">{driver?.name}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-card p-2 rounded-2xl border border-border/50">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 font-bold capitalize">
            <Calendar className="h-4 w-4 text-primary" />
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <PackageCheck className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase opacity-70">Entregas</span>
              </div>
              <p className="text-2xl font-black text-foreground">{stats.totalDeliveries}</p>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border-none shadow-sm bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-700" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase opacity-70">Minha Parte</span>
              </div>
              <p className="text-2xl font-black text-green-700">{formatCurrency(stats.totalCommission)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-sm overflow-hidden border-border/50">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Volume de Pedidos</span>
              <span className="font-bold">{formatCurrency(stats.totalReceived)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-border">
              <span className="text-muted-foreground">Valor por Entrega (Média)</span>
              <span className="font-bold text-primary">{formatCurrency(driver?.commission_percentage || 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <div className="space-y-4">
          <h2 className="font-bold text-foreground px-1">Histórico de Entregas</h2>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Nenhuma entrega finalizada neste mês.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Pedido #{order.id}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      <span>{order.payment_method.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-foreground">{formatCurrency(Number(order.total_amount))}</p>
                    <p className="text-[10px] font-bold text-green-600">+{formatCurrency(driver?.commission_percentage || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

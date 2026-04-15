import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ShoppingBag, 
  Clock, 
  Truck, 
  Store, 
  Loader2,
  Users,
  ChefHat,
  Utensils,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Award,
  Flame,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  RefreshCw,
   Radio,
   Wifi,
   WifiOff
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useTitleNotification } from '@/hooks/useTitleNotification';
import { PushNotificationToggle } from '@/components/admin/PushNotificationToggle';
import { SoundNotificationToggle } from '@/components/admin/SoundNotificationToggle';
import { toast } from 'sonner';

type Period = 'today' | 'week' | 'month';

interface OrderData {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  payment_method: string;
}

interface TableOrderData {
  id: number;
  total_amount: number | null;
  status: string | null;
  closed_at: string | null;
  opened_at: string | null;
  customer_count: number | null;
  payment_method: string | null;
}

interface OrderItemData {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface TableOrderItemData {
  product_name: string;
  quantity: number;
  unit_price: number;
}

const CHART_COLORS = ['hsl(45, 100%, 51%)', 'hsl(142, 76%, 49%)', 'hsl(200, 80%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(340, 75%, 55%)'];
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('today');
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('dashboard-auto-refresh');
    return saved !== 'false';
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(30);
  const lastOrderCountRef = useRef<number | null>(null);

  const getDateRange = (p: Period) => {
    const now = new Date();
    switch (p) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const getPreviousDateRange = (p: Period) => {
    const now = new Date();
    switch (p) {
      case 'today':
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case 'week':
        return { start: startOfWeek(subDays(now, 7), { locale: ptBR }), end: endOfWeek(subDays(now, 7), { locale: ptBR }) };
      case 'month':
        return { start: startOfMonth(subDays(now, 30)), end: endOfMonth(subDays(now, 30)) };
    }
  };

  const dateRange = getDateRange(period);

  // Fetch all dashboard stats in a single request
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => {
      return api.get<any>(`/dashboard/stats?start=${format(dateRange.start, 'yyyy-MM-dd HH:mm:ss')}&end=${format(dateRange.end, 'yyyy-MM-dd HH:mm:ss')}`);
    },
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
  });

  // Reusing existing refetch for compatibility
  const refetchDelivery = refetch;
  const refetchPDV = refetch;
  const refetchKitchen = refetch;
  const refetchTables = refetch;

  const handleRefresh = useCallback(() => {
    refetch();
    setLastRefresh(new Date());
    setCountdown(30);
  }, [refetch]);

  // Combined stats from the unified endpoint
  const stats = useMemo(() => {
    if (!dashboardData) return null;

    const { stats: s, top_products, hourly_data, payment_methods } = dashboardData;

    // Calculate growth percentages
    const revenueGrowth = s.prev_revenue > 0 
      ? (( (s.delivery_revenue + s.pdv_revenue) - s.prev_revenue) / s.prev_revenue) * 100 
      : (s.delivery_revenue + s.pdv_revenue) > 0 ? 100 : 0;

    const currentTotalOrders = s.delivery_count + s.pdv_count;
    const ordersGrowth = s.prev_orders > 0
      ? ((currentTotalOrders - s.prev_orders) / s.prev_orders) * 100
      : currentTotalOrders > 0 ? 100 : 0;

    const avgTicket = currentTotalOrders > 0 ? (s.delivery_revenue + s.pdv_revenue) / currentTotalOrders : 0;
    const prevAvgTicket = s.prev_orders > 0 ? s.prev_revenue / s.prev_orders : 0;
    const ticketGrowth = prevAvgTicket > 0
      ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100
      : avgTicket > 0 ? 100 : 0;

    // Process hourly data
    const hourMap = new Map<number, { count: number; revenue: number }>();
    hourly_data.forEach((d: any) => {
      const h = parseInt(d.hour);
      const current = hourMap.get(h) || { count: 0, revenue: 0 };
      hourMap.set(h, { 
        count: current.count + parseInt(d.count), 
        revenue: current.revenue + parseFloat(d.revenue) 
      });
    });

    const hourlyChartData = Array.from({ length: 24 }, (_, i) => {
      const data = hourMap.get(i) || { count: 0, revenue: 0 };
      return {
        hour: `${i}h`,
        pedidos: data.count,
        faturamento: data.revenue
      };
    }).filter(d => d.pedidos > 0 || d.faturamento > 0);

    // Filter top products
    const topProducts = top_products.map((p: any) => ({
      name: p.product_name,
      quantity: parseInt(p.quantity),
      revenue: parseFloat(p.revenue)
    }));

    // Payment methods map
    const payMap = new Map<string, number>();
    payment_methods.forEach((p: any) => {
      const name = p.name === 'pix' ? 'PIX' : p.name === 'card' ? 'Cartão' : p.name === 'money' ? 'Dinheiro' : p.name;
      payMap.set(name, (payMap.get(name) || 0) + parseFloat(p.value));
    });

    const peakHours = Array.from(hourMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([hour, data]) => ({ hour: `${hour}:00`, ...data }));

    return {
      totalRevenue: s.delivery_revenue + s.pdv_revenue,
      deliveryTotal: s.delivery_revenue,
      pdvTotal: s.pdv_revenue,
      deliveryCount: s.delivery_count,
      pdvCount: s.pdv_count,
      totalOrders: currentTotalOrders,
      topProducts,
      peakHours,
      hourlyChartData,
      deliveryPercentage: (s.delivery_revenue + s.pdv_revenue) > 0 ? (s.delivery_revenue / (s.delivery_revenue + s.pdv_revenue)) * 100 : 0,
      pdvPercentage: (s.delivery_revenue + s.pdv_revenue) > 0 ? (s.pdv_revenue / (s.delivery_revenue + s.pdv_revenue)) * 100 : 0,
      revenueGrowth,
      ordersGrowth,
      avgTicket,
      ticketGrowth,
      totalCustomers: s.pdv_count, // Fallback if customer_count not summed
      avgTableTime: 0, // Simplified for now
      paymentMethodsData: Array.from(payMap.entries()).map(([name, value]) => ({ name, value })),
      orderStatusData: [
        { status: 'Pendente', count: s.pending_delivery },
        { status: 'Preparando', count: s.preparing_delivery },
        { status: 'Cancelado', count: s.cancelled_delivery }
      ],
      cancellationRate: s.total_delivery_orders > 0 ? (s.cancelled_delivery / s.total_delivery_orders) * 100 : 0,
      pendingOrders: s.pending_delivery,
      kitchenPending: s.kitchen_pending,
      occupiedTables: s.occupied_tables,
      totalCustomersToday: s.pdv_count, // Use pdv_count as proxy for customers if not summed
    } as any;
  }, [dashboardData]);

  // Update ref for title notification tracking
  useEffect(() => {
    if (stats) {
      lastOrderCountRef.current = stats.pendingOrders;
    }
  }, [stats?.pendingOrders]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const periodLabels = {
    today: 'Hoje',
    week: 'Esta Semana',
    month: 'Este Mês'
  };

  // Title notification for pending orders
  useTitleNotification(stats?.pendingOrders || 0, 'Dashboard');

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, handleRefresh]);

  // Countdown timer
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Toggle handlers
  const handleAutoRefreshToggle = (checked: boolean) => {
    setAutoRefresh(checked);
    localStorage.setItem('dashboard-auto-refresh', String(checked));
    if (checked) {
      setCountdown(30);
    }
  };

  if (isLoading || !stats) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground">Carregando dados otimizados...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Visão Geral
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            {/* Sound Toggle */}
            <SoundNotificationToggle />

            {/* Browser Notification Toggle */}
            <PushNotificationToggle />

            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              {autoRefresh ? (
                <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
              ) : (
                <WifiOff className="w-4 h-4 text-muted-foreground" />
              )}
              <Switch
                checked={autoRefresh}
                onCheckedChange={(checked) => {
                  console.log('[Dashboard] Auto refresh toggle:', checked);
                  handleAutoRefreshToggle(checked);
                }}
                className="data-[state=checked]:bg-green-500"
              />
              {autoRefresh && (
                <span className="text-xs text-muted-foreground w-6">{countdown}s</span>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('[Dashboard] Refresh button clicked');
                handleRefresh();
                toast.success('Dados atualizados!');
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Real-time indicator */}
        {autoRefresh && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Modo tempo real ativo</span>
            <span className="text-xs">• Última atualização: {format(lastRefresh, 'HH:mm:ss')}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
              <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Live Status Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className={`bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 animate-fade-in ${stats.pendingOrders > 0 ? 'ring-2 ring-orange-500/50 ring-offset-2 ring-offset-background' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center ${stats.pendingOrders > 0 ? 'animate-pulse' : ''}`}>
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
                    <p className="text-xs text-muted-foreground">Aguardando</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.kitchenPending}</p>
                    <p className="text-xs text-muted-foreground">Na Cozinha</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.occupiedTables}</p>
                    <p className="text-xs text-muted-foreground">Mesas Abertas</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalCustomers}</p>
                    <p className="text-xs text-muted-foreground">Clientes {periodLabels[period]}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenue */}
              <Card className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/30 overflow-hidden relative animate-fade-in">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Faturamento Total</p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(stats.totalRevenue)}
                      </p>
                      <div className={`flex items-center gap-1 text-sm ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {stats.revenueGrowth >= 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span className="font-medium">{Math.abs(stats.revenueGrowth).toFixed(1)}%</span>
                        <span className="text-muted-foreground">vs anterior</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg">
                      <DollarSign className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Orders */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Pedidos</p>
                      <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
                      <div className={`flex items-center gap-1 text-sm ${stats.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {stats.ordersGrowth >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium">{Math.abs(stats.ordersGrowth).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <ShoppingBag className="w-7 h-7 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Ticket */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(stats.avgTicket)}
                      </p>
                      <div className={`flex items-center gap-1 text-sm ${stats.ticketGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {stats.ticketGrowth >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium">{Math.abs(stats.ticketGrowth).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                      <Target className="w-7 h-7 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Table Time */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Tempo Médio Mesa</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats.avgTableTime > 0 ? `${Math.round(stats.avgTableTime)}min` : '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stats.pdvCount} mesas fechadas
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                      <Clock className="w-7 h-7 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delivery vs PDV Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Delivery</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(stats.deliveryTotal)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {stats.deliveryCount} pedidos
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Participação</span>
                      <span className="font-medium">{stats.deliveryPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.deliveryPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Salão (PDV)</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(stats.pdvTotal)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {stats.pdvCount} mesas
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Participação</span>
                      <span className="font-medium">{stats.pdvPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.pdvPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Hourly Chart */}
              <Card className="lg:col-span-2 animate-fade-in">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Faturamento por Hora
                  </CardTitle>
                  <CardDescription>Distribuição de vendas ao longo do dia</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.hourlyChartData.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Nenhum dado disponível no período</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.hourlyChartData}>
                          <defs>
                            <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="hour" className="text-xs" />
                          <YAxis 
                            tickFormatter={(value) => `R$${value}`} 
                            className="text-xs"
                          />
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="faturamento" 
                            stroke="hsl(45, 100%, 51%)" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorFaturamento)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods Pie Chart */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Formas de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.paymentMethodsData.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <PieChart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Nenhum dado</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={stats.paymentMethodsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {stats.paymentMethodsData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {stats.paymentMethodsData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-muted-foreground">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Products and Peak Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Products */}
              <Card className="animate-fade-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Produtos Mais Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topProducts.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Nenhum produto vendido no período</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.topProducts.map((product, index) => (
                        <div key={product.name} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                            index === 1 ? 'bg-gray-400/20 text-gray-600' :
                            index === 2 ? 'bg-amber-600/20 text-amber-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index === 0 ? <Award className="w-4 h-4" /> : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(product.revenue)}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">{product.quantity} un.</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Horários de Pico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.peakHours.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Nenhum dado disponível no período</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.peakHours.map(({ hour, count, revenue }, index) => (
                        <div key={hour} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-primary/20 text-primary' :
                            index === 1 ? 'bg-secondary/20 text-secondary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{hour}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(revenue)}</p>
                          </div>
                          <Badge variant="outline">{count} pedidos</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </>
        )}
      </div>
    </AdminLayout>
  );
}

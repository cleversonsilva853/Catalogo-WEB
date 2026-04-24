import { useState } from 'react';
import { Clock, Phone, MapPin, Bike } from 'lucide-react';
import { StoreConfig } from '@/hooks/useStore';
import { SocialMedia } from '@/hooks/useSocialMedia';
import { useBusinessHours, getDayName } from '@/hooks/useBusinessHours';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface StoreInfoProps {
  store: StoreConfig;
}

export function StoreInfo({ store }: StoreInfoProps) {
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const { data: businessHours } = useBusinessHours();
  const storeStatus = useStoreStatus();

  const formatPhone = (phone: string | null) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  // Get Brazil current day
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  });
  const dayName = dayFormatter.format(new Date());
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  const currentDay = dayMap[dayName] ?? new Date().getDay();

  // Get today's active slots for display
  const todaySlots = businessHours?.filter(h => h.day_of_week === currentDay && h.is_active) || [];
  const todaySchedule = todaySlots.length > 0
    ? todaySlots.map(s => `${formatTime(s.open_time)} - ${formatTime(s.close_time)}`).join(' | ')
    : null;

  // Group hours by day for the modal
  const hoursByDay: Record<number, typeof todaySlots> = {};
  if (businessHours) {
    for (const h of businessHours) {
      if (!hoursByDay[h.day_of_week]) hoursByDay[h.day_of_week] = [];
      hoursByDay[h.day_of_week].push(h);
    }
  }

  return (
    <>
      {/* Primary Info - Large Block */}
      <div className="mt-0 px-4 flex justify-center mb-2">
        {/* Status */}
        <div className="flex flex-row items-center justify-between gap-3 rounded-2xl bg-card p-4 sm:p-5 shadow-sm w-full sm:max-w-[400px] transition-all border border-border/20 mx-auto">
          
          <div className="flex flex-row items-center gap-3 overflow-hidden">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${storeStatus.isOpen ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <Clock className={`h-5 w-5 ${storeStatus.isOpen ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            
            <div className="flex flex-col text-left truncate">
              <p className={`text-sm font-bold uppercase tracking-wider ${storeStatus.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                {storeStatus.isOpen ? 'Aberto' : 'Fechado'}
              </p>
              {!storeStatus.isForcedOpen && (
                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold mt-0.5 truncate">
                  {storeStatus.isOpen && todaySchedule
                    ? `Hoje das ${todaySchedule}`
                    : storeStatus.message
                  }
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setHoursModalOpen(true)}
            className={`text-[10px] sm:text-xs font-bold uppercase px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shrink-0 border ${storeStatus.isOpen ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'} hover:bg-black/5 transition-colors`}
          >
            Horários
          </button>
          
        </div>
      </div>

      {/* Secondary Info - Side by Side Pills */}
      <div className="flex gap-2 mt-2 px-4 overflow-x-auto scrollbar-hide pb-2 snap-x md:justify-center md:flex-wrap md:overflow-visible">
        {/* Phone */}
        {store.phone_whatsapp && (
          <a
            href={`https://api.whatsapp.com/send?phone=55${store.phone_whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent('Olá! Vim pelo cardápio digital.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-card px-4 py-3 rounded-[16px] shadow-sm whitespace-nowrap min-w-max border border-border/10 transition-transform active:scale-95 snap-start"
          >
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-[12px] font-bold">WhatsApp</span>
          </a>
        )}

        {/* Location */}
        {store.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-card px-4 py-3 rounded-[16px] shadow-sm whitespace-nowrap min-w-max border border-border/10 transition-transform active:scale-95 snap-start"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-[12px] font-bold">Local</span>
          </a>
        )}

        {/* Delivery */}
        <div 
          onClick={() => alert(`📦 Entrega: ${store.delivery_time_min || 30}-${store.delivery_time_max || 45} mins\n💳 Taxa: R$ ${Number(store.delivery_fee).toFixed(2).replace('.', ',')}`)}
          className="flex items-center gap-2 bg-card px-4 py-3 rounded-[16px] shadow-sm whitespace-nowrap min-w-max border border-border/10 transition-transform active:scale-95 snap-start cursor-pointer"
        >
          <Bike className="h-4 w-4 text-primary" />
          <span className="text-[12px] font-bold">Entrega</span>
        </div>
      </div>

      {/* Hours Modal - grouped by day with multiple slots */}
      <Dialog open={hoursModalOpen} onOpenChange={setHoursModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários de Funcionamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const daySlots = hoursByDay[day] || [];
              const activeSlots = daySlots.filter(s => s.is_active);
              const isToday = day === currentDay;

              return (
                <div
                  key={day}
                  className={`flex items-start justify-between p-3 rounded-lg transition-colors ${isToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {getDayName(day)}
                    </span>
                    {isToday && (
                      <Badge variant="default" className="text-xs">Hoje</Badge>
                    )}
                  </div>
                  <div className="text-right space-y-0.5">
                    {activeSlots.length > 0 ? (
                      activeSlots.map((slot) => (
                        <p key={slot.id} className="text-sm text-foreground">
                          {formatTime(slot.open_time)} - {formatTime(slot.close_time)}
                        </p>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Fechado</span>
                    )}
                  </div>
                </div>
              );
            })}

            {(!businessHours || businessHours.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                Horários não configurados
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

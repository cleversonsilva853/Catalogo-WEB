import { useStore } from './useStore';
import { useBusinessHours, BusinessHour } from './useBusinessHours';

export function isStoreCurrentlyOpen(hours: BusinessHour[]): boolean {
  if (!hours || hours.length === 0) return false;
  const now = new Date();
  const currentDay = now.getDay();
  const currentHourFunc = now.getHours() * 60 + now.getMinutes();

  const activeHours = hours.filter(h => h.is_active && h.day_of_week === currentDay);
  if (activeHours.length === 0) return false;

  for (const period of activeHours) {
    const [openH, openM] = period.open_time.split(':').map(Number);
    const [closeH, closeM] = period.close_time.split(':').map(Number);
    
    const openMins = openH * 60 + (openM || 0);
    const closeMins = closeH * 60 + (closeM || 0);
    
    // Suporta horário até a madrugada (ex: 18:00 as 02:00)
    if (closeMins < openMins) {
      if (currentHourFunc >= openMins || currentHourFunc <= closeMins) return true;
    } else {
      if (currentHourFunc >= openMins && currentHourFunc <= closeMins) return true;
    }
  }
  return false;
}

export interface StoreStatus {
  isOpen: boolean;
  reason: 'open' | 'manual_closed' | 'hours_closed';
  message: string;
  isForcedOpen: boolean;
}

/**
 * Hook que combina o status manual da loja (is_open) com os horários de funcionamento.
 * 
 * REGRAS:
 * 1. Se tem horários configurados e está DENTRO do horário -> Loja ABERTA automaticamente
 * 2. Se tem horários configurados e está FORA do horário -> Loja FECHADA automaticamente
 *    - Exceção: is_open=true pode forçar abertura fora do horário
 * 3. Se NÃO tem horários configurados -> usa is_open do banco
 * 
 * O botão is_open funciona como OVERRIDE manual:
 * - Fora do horário: pode forçar abertura (ex: evento especial)
 * - Dentro do horário: a loja abre automaticamente (toggle não interfere)
 */
export function useStoreStatus(): StoreStatus {
  const { data: store } = useStore();
  const { data: businessHours } = useBusinessHours();

  // Default: loja fechada se não tiver dados
  if (!store) {
    return {
      isOpen: false,
      reason: 'manual_closed',
      message: 'Loja não configurada',
      isForcedOpen: false,
    };
  }

  // Verificar horário de funcionamento
  const hasBusinessHours = businessHours && businessHours.length > 0;
  const isWithinBusinessHours = hasBusinessHours 
    ? isStoreCurrentlyOpen(businessHours) 
    : null; // null = sem horários configurados

  // Se tem horários configurados
  if (hasBusinessHours && isWithinBusinessHours !== null) {
    if (isWithinBusinessHours) {
      // DENTRO do horário -> ABERTA automaticamente
      return {
        isOpen: true,
        reason: 'open',
        message: 'Recebendo pedidos (horário automático)',
        isForcedOpen: false,
      };
    } else {
      // FORA do horário
      if (store.is_open) {
        // is_open=true -> forçar abertura fora do horário
        return {
          isOpen: true,
          reason: 'open',
          message: 'Loja aberta manualmente (fora do horário)',
          isForcedOpen: true,
        };
      }
      return {
        isOpen: false,
        reason: 'hours_closed',
        message: 'Fora do horário de funcionamento',
        isForcedOpen: false,
      };
    }
  }

  // Sem horários configurados -> usa is_open do banco
  if (store.is_open) {
    return {
      isOpen: true,
      reason: 'open',
      message: 'Recebendo pedidos',
      isForcedOpen: true,
    };
  }

  return {
    isOpen: false,
    reason: 'manual_closed',
    message: 'Loja fechada manualmente',
    isForcedOpen: false,
  };
}

/**
 * Hook simples que retorna apenas se a loja está aberta ou não.
 * Usa a mesma lógica combinada de status + horário.
 */
export function useIsStoreOpen(): boolean {
  const status = useStoreStatus();
  return status.isOpen;
}

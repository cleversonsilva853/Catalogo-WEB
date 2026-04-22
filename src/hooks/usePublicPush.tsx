import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registra silenciosamente a subscription push do cliente público
 * (visitante do cardápio). Só tenta após já ter permissão concedida.
 * Se a permissão ainda não foi concedida, não prompta — aguarda o usuário
 * aceitar o prompt da PWA.
 */
export function usePublicPush() {
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // Só registra se o usuário já deu permissão (não forçamos o prompt aqui)
    if (Notification.permission !== 'granted') return;

    attempted.current = true;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const pm = (registration as any).pushManager;

        // Verifica se já tem subscription ativa
        const existing = await pm.getSubscription();
        
        // Busca a public key do servidor
        const { publicKey } = await api.get('/push/vapid-key') as { publicKey: string };

        let subscription = existing;
        if (!existing) {
          subscription = await pm.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        if (!subscription) return;

        const subJson = subscription.toJSON();

        // Registra no backend com user_type = 'customer'
        await api.post('/push/subscribe', {
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
          user_type: 'customer',
          user_identifier: null,
        });
      } catch {
        // Silencioso — não interrompe a experiência do usuário
      }
    })();
  }, []);
}

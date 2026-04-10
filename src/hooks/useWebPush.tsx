import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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

export function useWebPush(userType: 'admin' | 'driver' | 'waiter', userIdentifier?: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, [checkExistingSubscription]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }

    setIsLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error('Permissão de notificação negada.');
        return false;
      }

      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) registration = await navigator.serviceWorker.register('/sw.js');

      if (!registration.active) {
        await new Promise<void>((resolve) => {
          const sw = registration!.installing || registration!.waiting;
          if (!sw) { resolve(); return; }
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') resolve();
          });
        });
      }

      const { publicKey } = await api.get('/push/vapid-key') as { publicKey: string };
      
      const pm = (await navigator.serviceWorker.ready as any).pushManager;
      
      const existingSub = await pm.getSubscription();
      if (existingSub) await existingSub.unsubscribe();

      const subscription = await pm.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
        user_type: userType,
        user_identifier: userIdentifier || null,
      });

      setIsSubscribed(true);
      toast.success('Notificações push ativadas!');
      return true;
    } catch (error: any) {
      toast.error('Erro ao assinar notificações');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, userType, userIdentifier]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.delete(`/push/unsubscribe?endpoint=${encodeURIComponent(endpoint)}`);
      }
      setIsSubscribed(false);
      toast.success('Notificações desativadas');
    } catch (error) {
      // ignore
    }
  }, []);

  return { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe };
}

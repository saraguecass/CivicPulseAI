import { getVapidPublicKey } from './api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Workers no soportados en este navegador.');
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('[PWA] Service Worker registrado:', reg.scope);
    return reg;
  } catch (err) {
    console.warn('[PWA] Error registrando Service Worker:', err);
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Push] Notificaciones Push no soportadas.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('[Push] Permiso de notificaciones denegado por el usuario.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub) return sub;

    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      console.log('[Push] No hay clave VAPID configurada en backend; se usará aviso en interfaz.');
      return null;
    }

    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    return sub;
  } catch (err) {
    console.warn('[Push] Error al suscribir a push:', err);
    return null;
  }
}

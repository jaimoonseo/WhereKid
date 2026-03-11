/**
 * Web Push Notification utilities
 */

export interface NotificationPermissionStatus {
  supported: boolean;
  permission: NotificationPermission | null;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (!isPushNotificationSupported()) {
    return { supported: false, permission: null };
  }

  return {
    supported: true,
    permission: Notification.permission,
  };
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Schedule a local notification (without push server)
 * This uses setTimeout to schedule notifications
 */
export function scheduleLocalNotification(
  title: string,
  body: string,
  delayMs: number
): number {
  const timeoutId = window.setTimeout(() => {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'schedule-notification',
          requireInteraction: false,
        });
      });
    }
  }, delayMs);

  return timeoutId;
}

/**
 * Cancel a scheduled notification
 */
export function cancelScheduledNotification(timeoutId: number): void {
  window.clearTimeout(timeoutId);
}

/**
 * Calculate milliseconds until notification time (10 minutes before schedule)
 */
export function calculateNotificationDelay(scheduleTime: string): number {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const scheduleDate = new Date(koreaTime);
  scheduleDate.setHours(hours, minutes - 10, 0, 0); // 10분 전

  const delay = scheduleDate.getTime() - koreaTime.getTime();

  // If delay is negative or more than 24 hours, don't schedule
  if (delay < 0 || delay > 24 * 60 * 60 * 1000) {
    return -1;
  }

  return delay;
}

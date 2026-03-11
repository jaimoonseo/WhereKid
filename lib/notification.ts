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
 * Schedule a notification via Service Worker (works in background)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  delayMs: number
): Promise<number> {
  if (Notification.permission !== 'granted') {
    return -1;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const showAt = Date.now() + delayMs;

    // Service Worker로 메시지 전송
    registration.active?.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      title,
      body,
      showAt,
    });

    // IndexedDB에 저장
    await saveNotificationToDB({
      title,
      body,
      showAt,
    });

    // fallback으로 setTimeout도 사용 (탭이 열려있을 때를 위해)
    const timeoutId = window.setTimeout(async () => {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'schedule-notification',
        requireInteraction: false,
      });
    }, delayMs);

    return timeoutId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return -1;
  }
}

/**
 * Save notification to IndexedDB
 */
async function saveNotificationToDB(notification: { title: string; body: string; showAt: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotificationDB', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const addRequest = store.add(notification);

      addRequest.onerror = () => reject(addRequest.error);
      addRequest.onsuccess = () => resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
        store.createIndex('showAt', 'showAt', { unique: false });
      }
    };
  });
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

/**
 * Initialize notification system (call once on app load)
 */
export async function initializeNotificationSystem(): Promise<void> {
  if (!isPushNotificationSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Service Worker에게 알림 체크 시작 요청
    registration.active?.postMessage({
      type: 'CHECK_SCHEDULED_NOTIFICATIONS',
    });
  } catch (error) {
    console.error('Failed to initialize notification system:', error);
  }
}

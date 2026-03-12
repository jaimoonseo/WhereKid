/* eslint-disable no-restricted-globals */
// Service Worker for Web Push Notifications

const CACHE_NAME = 'wherekid-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - 알림 수신
self.addEventListener('push', (event) => {
  console.log('Push received:', event);

  let data = {
    title: '스케줄 알림',
    body: '곧 스케줄이 시작됩니다!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'schedule-notification',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'schedule-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 윈도우가 있으면 포커스
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 윈도우 열기
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event - 메인 앱에서 알림 스케줄 받기
self.addEventListener('message', (event) => {
  console.log('Message received:', event.data);

  // SCHEDULE_NOTIFICATION 메시지는 IndexedDB 저장만 하고
  // 실제 알림은 periodic check에서 처리 (중복 방지)

  if (event.data.type === 'CHECK_SCHEDULED_NOTIFICATIONS') {
    // 저장된 알림 확인 및 발송
    checkAndSendNotifications();
  }
});

// Periodic check for scheduled notifications (매 1분마다)
async function checkAndSendNotifications() {
  try {
    // IndexedDB에서 예약된 알림 가져오기
    const db = await openNotificationDB();
    const notifications = await getScheduledNotifications(db);
    const now = Date.now();

    for (const notification of notifications) {
      if (notification.showAt <= now) {
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `schedule-${notification.showAt}`, // 고유 태그로 중복 방지
          requireInteraction: false,
        });
        // 발송한 알림은 DB에서 삭제
        await deleteNotification(db, notification.id);
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// IndexedDB 관련 함수들
function openNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotificationDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notifications')) {
        const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
        store.createIndex('showAt', 'showAt', { unique: false });
      }
    };
  });
}

function getScheduledNotifications(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteNotification(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// 1분마다 알림 체크
setInterval(checkAndSendNotifications, 60000);

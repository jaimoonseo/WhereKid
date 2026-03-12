'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  registerServiceWorker,
} from '@/lib/notification';
import { formatPhoneNumber } from '@/lib/sms';

interface DbTestResult {
  success: boolean;
  message: string;
  data?: {
    status: string;
    provider: string;
    counts: {
      children: number;
      academies: number;
      schedules: number;
      paymentPlans: number;
    };
    timestamp: string;
  };
  error?: {
    name: string;
    message: string;
    code: string;
  };
}

interface Contact {
  id: number;
  childId: number;
  name: string;
  phoneNumber: string;
  isDefault: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<DbTestResult | null>(null);
  const [testingDb, setTestingDb] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Notification states
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // Contact states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactDefault, setNewContactDefault] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    // Check notification support
    const status = getNotificationPermissionStatus();
    setNotificationSupported(status.supported);
    setNotificationPermission(status.permission);
    setNotificationEnabled(status.permission === 'granted');

    // Register service worker if supported
    if (status.supported) {
      registerServiceWorker();
    }

    // Load contacts
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contact');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const testConnection = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/test-db');
      const data = await res.json();
      setDbTestResult(data);
      setShowDbModal(true);
    } catch (error) {
      setDbTestResult({
        success: false,
        message: '네트워크 오류',
        error: {
          name: 'NetworkError',
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          code: 'N/A'
        },
      });
      setShowDbModal(true);
    } finally {
      setTestingDb(false);
    }
  };

  const handleSave = () => {
    // localStorage에 저장 (실제로는 서버 환경변수 사용)
    if (databaseUrl) {
      localStorage.setItem('DATABASE_URL', databaseUrl);
      setSaveMessage('✅ 설정이 저장되었습니다. (재배포 필요)');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      setNotificationEnabled(permission === 'granted');

      if (permission === 'granted') {
        // Save preference to localStorage
        localStorage.setItem('notifications_enabled', 'true');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const handleDisableNotifications = () => {
    localStorage.setItem('notifications_enabled', 'false');
    setNotificationEnabled(false);
  };

  const handleTestNotification = () => {
    if (notificationPermission === 'granted') {
      // 1분 후 테스트 알림 발송
      setTimeout(() => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('🎉 WhereKid에 오신 것을 환영합니다!', {
            body: '알림이 정상적으로 작동하고 있습니다. 스케줄 10분 전에 자동으로 알림을 받으실 수 있습니다.',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'test-notification',
            requireInteraction: false,
          });
        });
      }, 60000); // 60초 = 1분

      alert('✅ 테스트 알림이 예약되었습니다!\n1분 후에 알림을 받으실 수 있습니다.');
    }
  };

  const handleTestShare = async () => {
    const shareText = '우리 아이가 지금 영어학원(16:10-17:37)에 있어요 📚';

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('📋 클립보드에 복사되었습니다!\n\n' + shareText);
      } catch {
        console.error('Failed to copy');
      }
    }
  };

  const checkScheduledNotifications = async () => {
    try {
      const db = await openNotificationDB();
      const notifications = await getScheduledNotifications(db) as Array<{ title: string; showAt: number }>;

      if (notifications.length === 0) {
        alert('📭 예약된 알림이 없습니다.');
      } else {
        const now = Date.now();
        const notificationList = notifications.map((n) => {
          const timeUntil = Math.round((n.showAt - now) / 1000 / 60);
          const status = timeUntil <= 0 ? '발송 대기' : `${timeUntil}분 후`;
          return `• ${n.title} - ${status}`;
        }).join('\n');

        alert(`📬 예약된 알림 (${notifications.length}개)\n\n${notificationList}`);
      }
    } catch (error) {
      alert('❌ 알림 확인 실패\n\n' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  // IndexedDB helper functions
  const openNotificationDB = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('NotificationDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
          store.createIndex('showAt', 'showAt', { unique: false });
        }
      };
    });
  };

  const getScheduledNotifications = (db: IDBDatabase) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const handleAddContact = async () => {
    if (!newContactName || !newContactPhone) {
      setContactMessage('❌ 이름과 전화번호를 입력하세요.');
      setTimeout(() => setContactMessage(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: 1, // Default child ID for MVP
          name: newContactName,
          phoneNumber: newContactPhone,
          isDefault: newContactDefault,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '연락처 추가 실패');
      }

      setContactMessage('✅ 연락처가 추가되었습니다.');
      setNewContactName('');
      setNewContactPhone('');
      setNewContactDefault(false);
      setShowContactModal(false);
      fetchContacts();
      setTimeout(() => setContactMessage(''), 3000);
    } catch (error) {
      setContactMessage('❌ ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      setTimeout(() => setContactMessage(''), 3000);
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('이 연락처를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('연락처 삭제 실패');
      }

      setContactMessage('✅ 연락처가 삭제되었습니다.');
      fetchContacts();
      setTimeout(() => setContactMessage(''), 3000);
    } catch (error) {
      setContactMessage('❌ ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      setTimeout(() => setContactMessage(''), 3000);
    }
  };

  const handleToggleDefault = async (id: number, currentDefault: boolean) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDefault: !currentDefault,
        }),
      });

      if (!res.ok) {
        throw new Error('기본 연락처 설정 실패');
      }

      fetchContacts();
    } catch (error) {
      setContactMessage('❌ ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      setTimeout(() => setContactMessage(''), 3000);
    }
  };

  const handleTestSMS = async () => {
    const defaultContact = contacts.find((c) => c.isDefault);
    if (!defaultContact) {
      alert('❌ 기본 연락처를 먼저 설정하세요.');
      return;
    }

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '[WhereKid 테스트] SMS 전송 기능이 정상 작동합니다! 📱',
          sendToDefault: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ 테스트 메시지 전송 완료!\n\n수신: ${defaultContact.name} (${defaultContact.phoneNumber})\n\n* 현재는 개발 모드로 실제 SMS는 전송되지 않습니다.\n* 실제 SMS 전송을 위해서는 SMS 서비스(SENS, Aligo 등)를 연동하세요.`);
      } else {
        alert('❌ 메시지 전송 실패');
      }
    } catch (error) {
      alert('❌ 메시지 전송 실패\n\n' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">⚙️ 설정</h2>
          <p className="text-sm text-gray-400">데이터베이스 연결 설정을 관리합니다</p>
        </div>

        {/* 알림 설정 */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔔 스케줄 알림</h3>

          {!notificationSupported ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">
                ❌ 이 브라우저는 알림을 지원하지 않습니다.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Safari 또는 Chrome을 사용하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">스케줄 10분 전 알림</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {notificationPermission === 'granted'
                      ? notificationEnabled
                        ? '✅ 알림이 활성화되었습니다'
                        : '⏸️ 알림이 일시 중지되었습니다'
                      : notificationPermission === 'denied'
                      ? '❌ 알림 권한이 거부되었습니다'
                      : '⚠️ 알림 권한을 허용해주세요'}
                  </p>
                </div>

                {notificationPermission === 'granted' ? (
                  <button
                    onClick={notificationEnabled ? handleDisableNotifications : () => setNotificationEnabled(true)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      notificationEnabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {notificationEnabled ? '중지' : '활성화'}
                  </button>
                ) : notificationPermission === 'denied' ? (
                  <div className="text-sm text-gray-400 text-right">
                    <p>브라우저 설정에서</p>
                    <p>권한을 변경하세요</p>
                  </div>
                ) : (
                  <button
                    onClick={handleEnableNotifications}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    권한 요청
                  </button>
                )}
              </div>

              {notificationPermission === 'granted' && notificationEnabled && (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-400 text-sm font-medium mb-2">💡 알림 작동 방식</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• 오늘 스케줄 10분 전에 자동 알림</li>
                      <li>• 백그라운드에서도 작동</li>
                      <li>• 홈 화면에 추가하면 더 좋습니다</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleTestNotification}
                      className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      🧪 테스트 알림 보내기 (1분 후)
                    </button>
                    <button
                      onClick={checkScheduledNotifications}
                      className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      📬 예약된 알림 확인
                    </button>
                    <button
                      onClick={handleTestShare}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      📤 공유 기능 테스트
                    </button>
                  </div>
                </>
              )}

              {notificationPermission === 'default' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm font-medium mb-2">📱 아이폰 사용자</p>
                  <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                    <li>Safari에서 이 페이지 열기</li>
                    <li>하단 공유 버튼 탭</li>
                    <li>&quot;홈 화면에 추가&quot; 선택</li>
                    <li>추가된 앱에서 알림 권한 요청</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 연락처 관리 */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">📱 SMS 연락처 관리</h3>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + 추가
            </button>
          </div>

          {contactMessage && (
            <div className={`mb-4 rounded-lg p-3 text-sm ${
              contactMessage.startsWith('✅')
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {contactMessage}
            </div>
          )}

          {contacts.length === 0 ? (
            <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-6 text-center">
              <p className="text-gray-400 text-sm mb-3">등록된 연락처가 없습니다.</p>
              <p className="text-xs text-gray-500">
                연락처를 추가하면 스케줄 정보를<br />
                자동으로 SMS로 전송할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-gray-700 border border-gray-600 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{contact.name}</p>
                      {contact.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded">
                          기본
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{contact.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleDefault(contact.id, contact.isDefault)}
                      className={`p-2 rounded-lg transition-colors ${
                        contact.isDefault
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      }`}
                      title={contact.isDefault ? '기본 연락처' : '기본으로 설정'}
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {contacts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={handleTestSMS}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                📤 테스트 SMS 보내기
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                기본 연락처로 테스트 메시지를 전송합니다
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">💾 데이터베이스 연결</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Database URL
                </label>
                <input
                  type="text"
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="postgresql://user:password@host:5432/database"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Supabase 연결 문자열을 입력하세요
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={testConnection}
                  disabled={testingDb}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {testingDb ? '테스트 중...' : '🔌 연결 테스트'}
                </button>
              </div>

              {saveMessage && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400">
                  {saveMessage}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">📖 설정 가이드</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="font-semibold text-white mb-2">1. Supabase 프로젝트 생성</p>
                <p className="text-xs text-gray-400">
                  • https://supabase.com/dashboard 접속<br />
                  • &quot;New Project&quot; 클릭<br />
                  • 프로젝트 이름 및 비밀번호 설정
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="font-semibold text-white mb-2">2. 연결 문자열 복사</p>
                <p className="text-xs text-gray-400">
                  • Project Settings → Database 이동<br />
                  • Connection string → URI 선택<br />
                  • [YOUR-PASSWORD]를 실제 비밀번호로 교체<br />
                  • 전체 문자열 복사
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="font-semibold text-white mb-2">3. Vercel 환경변수 설정</p>
                <p className="text-xs text-gray-400">
                  • Vercel 프로젝트 Settings → Environment Variables<br />
                  • Name: DATABASE_URL<br />
                  • Value: 복사한 연결 문자열<br />
                  • Environment: Production 체크<br />
                  • 저장 후 재배포
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="font-semibold text-white mb-2">4. 테이블 생성</p>
                <p className="text-xs text-gray-400">
                  • Supabase SQL Editor에서 테이블 생성 SQL 실행<br />
                  • RLS(Row Level Security) 비활성화<br />
                  • 시드 데이터 추가
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">🔗 유용한 링크</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-400 hover:text-blue-300"
              >
                → Supabase 대시보드
              </a>
              <a
                href="https://vercel.com/jmseos-projects/wherekid/settings/environment-variables"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-400 hover:text-blue-300"
              >
                → Vercel 환경변수 설정
              </a>
              <a
                href="https://github.com/jaimoonseo/WhereKid"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-400 hover:text-blue-300"
              >
                → GitHub 저장소
              </a>
            </div>
          </div>
        </div>

        {showDbModal && dbTestResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">DB 연결 테스트</h3>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {dbTestResult.success ? (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 font-semibold mb-2">✅ {dbTestResult.message}</p>
                  </div>

                  {dbTestResult.data && (
                    <>
                      <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-gray-400">데이터베이스 정보</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-white">
                            <span className="text-gray-400">Provider:</span> {dbTestResult.data.provider}
                          </p>
                          <p className="text-white">
                            <span className="text-gray-400">Status:</span> {dbTestResult.data.status}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-gray-400">데이터 개수</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-white">
                            <span className="text-gray-400">아이:</span> {dbTestResult.data.counts.children}
                          </p>
                          <p className="text-white">
                            <span className="text-gray-400">학원:</span> {dbTestResult.data.counts.academies}
                          </p>
                          <p className="text-white">
                            <span className="text-gray-400">스케줄:</span> {dbTestResult.data.counts.schedules}
                          </p>
                          <p className="text-white">
                            <span className="text-gray-400">납부:</span> {dbTestResult.data.counts.paymentPlans}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400">
                        {new Date(dbTestResult.data.timestamp).toLocaleString('ko-KR')}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 font-semibold mb-2">❌ {dbTestResult.message}</p>
                  </div>

                  {dbTestResult.error && (
                    <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-gray-400">오류 정보</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-white">
                          <span className="text-gray-400">Name:</span> {dbTestResult.error.name}
                        </p>
                        <p className="text-white">
                          <span className="text-gray-400">Code:</span> {dbTestResult.error.code}
                        </p>
                        <p className="text-white break-words">
                          <span className="text-gray-400">Message:</span> {dbTestResult.error.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowDbModal(false)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* 연락처 추가 모달 */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">📱 연락처 추가</h3>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setNewContactName('');
                    setNewContactPhone('');
                    setNewContactDefault(false);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="예: 엄마, 아빠, 할머니"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={newContactPhone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setNewContactPhone(formatted);
                    }}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    자동으로 하이픈이 추가됩니다
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newContactDefault}
                    onChange={(e) => setNewContactDefault(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-300">
                    기본 연락처로 설정
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowContactModal(false);
                      setNewContactName('');
                      setNewContactPhone('');
                      setNewContactDefault(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddContact}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  registerServiceWorker,
} from '@/lib/notification';

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
  }, []);

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
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-400 text-sm font-medium mb-2">💡 알림 작동 방식</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• 오늘 스케줄 10분 전에 자동 알림</li>
                    <li>• 백그라운드에서도 작동</li>
                    <li>• 홈 화면에 추가하면 더 좋습니다</li>
                  </ul>
                </div>
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
      </div>
    </Layout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ScheduleCard from '@/components/schedule/ScheduleCard';
import PaymentCard from '@/components/payment/PaymentCard';
import { getCurrentTime } from '@/lib/utils';

interface Schedule {
  id: number;
  startTime: string;
  endTime: string;
  academy: {
    id: number;
    name: string;
  };
}

interface Payment {
  id: number;
  amount: number;
  paymentDay: number;
  cycle: string;
  academy: {
    name: string;
  };
  daysUntil: number;
}

export default function Home() {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [nextSchedule, setNextSchedule] = useState<Schedule | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<Payment[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [isWeekend, setIsWeekend] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<any>(null);
  const [testingDb, setTestingDb] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const scheduleRes = await fetch('/api/schedule/today');
      const scheduleData = await scheduleRes.json();
      setTodaySchedules(scheduleData.schedules || []);
      setCurrentSchedule(scheduleData.currentSchedule);
      setNextSchedule(scheduleData.nextSchedule);
      setIsWeekend(scheduleData.isWeekend || false);

      const paymentsRes = await fetch('/api/payment/upcoming');
      const paymentsData = await paymentsRes.json();
      setUpcomingPayments(paymentsData.payments?.slice(0, 3) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testDbConnection = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/test-db');
      const data = await res.json();
      setDbTestResult(data);
      setShowDbModal(true);
    } catch (error: any) {
      setDbTestResult({
        success: false,
        message: '네트워크 오류',
        error: { message: error.message },
      });
      setShowDbModal(true);
    } finally {
      setTestingDb(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentTime(getCurrentTime());
    const interval = setInterval(() => setCurrentTime(getCurrentTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-400">현재 시간</p>
          <p className="text-3xl font-bold text-white">{currentTime || '--:--'}</p>
          <button
            onClick={testDbConnection}
            disabled={testingDb}
            className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {testingDb ? '테스트 중...' : '🔌 DB 연결 테스트'}
          </button>
        </div>

        {isWeekend ? (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-8 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-lg font-semibold text-white mb-1">주말이에요!</p>
          </div>
        ) : (
          <>
            {currentSchedule && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">🎯 지금 진행 중</h2>
                <ScheduleCard
                  title={currentSchedule.academy.name}
                  academy={currentSchedule.academy.name}
                  startTime={currentSchedule.startTime}
                  endTime={currentSchedule.endTime}
                  isActive
                />
              </div>
            )}
            {!currentSchedule && nextSchedule && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">⏰ 다음 스케줄</h2>
                <ScheduleCard
                  title={nextSchedule.academy.name}
                  academy={nextSchedule.academy.name}
                  startTime={nextSchedule.startTime}
                  endTime={nextSchedule.endTime}
                />
              </div>
            )}
            {todaySchedules.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">📋 오늘의 스케줄</h2>
                <div className="space-y-2">
                  {todaySchedules.map((s) => (
                    <ScheduleCard
                      key={s.id}
                      title={s.academy.name}
                      academy={s.academy.name}
                      startTime={s.startTime}
                      endTime={s.endTime}
                      isActive={currentSchedule?.id === s.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {upcomingPayments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">💳 곧 납부할 항목</h2>
            <div className="space-y-2">
              {upcomingPayments.map((p) => (
                <PaymentCard
                  key={p.id}
                  academy={p.academy.name}
                  amount={p.amount}
                  paymentDay={p.paymentDay}
                  cycle={p.cycle as 'MONTH' | 'WEEK'}
                  daysUntil={p.daysUntil}
                />
              ))}
            </div>
          </div>
        )}

        {showDbModal && dbTestResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 font-semibold mb-2">❌ {dbTestResult.message}</p>
                  </div>

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

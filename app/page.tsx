'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ScheduleCard from '@/components/schedule/ScheduleCard';
import PaymentCard from '@/components/payment/PaymentCard';
import { getCurrentTime, getDayName } from '@/lib/utils';

interface Schedule {
  id: number;
  startTime: string;
  endTime: string;
  dayOfWeek?: number;
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
            {!currentSchedule && nextSchedule && (() => {
              const koreaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
              const currentDayOfWeek = koreaTime.getDay();
              const isNextScheduleTomorrow = nextSchedule.dayOfWeek && nextSchedule.dayOfWeek !== currentDayOfWeek;
              const lastSchedule = todaySchedules.length > 0 ? todaySchedules[todaySchedules.length - 1] : null;

              return (
                <>
                  {isNextScheduleTomorrow && lastSchedule && (
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-3">📌 오늘 마지막 스케줄</h2>
                      <ScheduleCard
                        title={lastSchedule.academy.name}
                        academy={lastSchedule.academy.name}
                        startTime={lastSchedule.startTime}
                        endTime={lastSchedule.endTime}
                        isPast
                      />
                    </div>
                  )}
                  <div className={isNextScheduleTomorrow && lastSchedule ? 'mt-6' : ''}>
                    <h2 className="text-lg font-semibold text-white mb-3">
                      ⏰ 다음 스케줄
                      {isNextScheduleTomorrow && nextSchedule.dayOfWeek && (
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          ({getDayName(nextSchedule.dayOfWeek)})
                        </span>
                      )}
                    </h2>
                    <ScheduleCard
                      title={nextSchedule.academy.name}
                      academy={nextSchedule.academy.name}
                      startTime={nextSchedule.startTime}
                      endTime={nextSchedule.endTime}
                    />
                  </div>
                </>
              );
            })()}
            {todaySchedules.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">📋 오늘의 스케줄</h2>
                <div className="space-y-2">
                  {todaySchedules.map((s) => {
                    const isPast = !!(currentTime && s.endTime < currentTime);
                    return (
                      <ScheduleCard
                        key={s.id}
                        title={s.academy.name}
                        academy={s.academy.name}
                        startTime={s.startTime}
                        endTime={s.endTime}
                        isActive={currentSchedule?.id === s.id}
                        isPast={isPast}
                      />
                    );
                  })}
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
      </div>
    </Layout>
  );
}

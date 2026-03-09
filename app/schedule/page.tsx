'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ScheduleCard from '@/components/schedule/ScheduleCard';
import { getDayName } from '@/lib/utils';

interface Academy {
  id: number;
  name: string;
}

interface Schedule {
  id: number;
  academyId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  academy: Academy;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    academyId: '',
    dayOfWeek: '1',
    startTime: '',
    endTime: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, academiesRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/academy'),
      ]);
      const schedulesData = await schedulesRes.json();
      const academiesData = await academiesRes.json();
      setSchedules(schedulesData.schedules || []);
      setAcademies(academiesData.academies || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.academyId || !formData.startTime || !formData.endTime) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academyId: parseInt(formData.academyId),
          dayOfWeek: parseInt(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
      });

      if (res.ok) {
        setFormData({ academyId: '', dayOfWeek: '1', startTime: '', endTime: '' });
        setShowAddModal(false);
        await fetchData();
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getSchedulesForDay = (day: number) => {
    return schedules
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">주간 스케줄</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            disabled={academies.length === 0}
          >
            + 스케줄 추가
          </button>
        </div>

        {academies.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-xl mb-2">🏫</p>
            <p className="text-gray-400 mb-4">먼저 학원을 등록해주세요</p>
            <a
              href="/academy"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              학원 등록하기
            </a>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-xl mb-2">📅</p>
            <p className="text-gray-400 mb-4">등록된 스케줄이 없습니다</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              첫 스케줄 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((day) => {
              const daySchedules = getSchedulesForDay(day);
              if (daySchedules.length === 0) return null;

              return (
                <div key={day}>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-blue-400">{getDayName(day)}</span>
                    <span className="text-sm text-gray-400">
                      ({daySchedules.length}개)
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {daySchedules.map((schedule) => (
                      <ScheduleCard
                        key={schedule.id}
                        title={schedule.academy.name}
                        academy={schedule.academy.name}
                        startTime={schedule.startTime}
                        endTime={schedule.endTime}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">스케줄 추가</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    학원 *
                  </label>
                  <select
                    value={formData.academyId}
                    onChange={(e) => setFormData({ ...formData, academyId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">학원 선택</option>
                    {academies.map((academy) => (
                      <option key={academy.id} value={academy.id}>
                        {academy.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    요일 *
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="1">월요일</option>
                    <option value="2">화요일</option>
                    <option value="3">수요일</option>
                    <option value="4">목요일</option>
                    <option value="5">금요일</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    시작 시간 *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    종료 시간 *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ academyId: '', dayOfWeek: '1', startTime: '', endTime: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    disabled={submitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? '추가 중...' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

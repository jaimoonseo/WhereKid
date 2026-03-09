'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import PaymentCard from '@/components/payment/PaymentCard';

interface Academy {
  id: number;
  name: string;
}

interface PaymentPlan {
  id: number;
  academyId: number;
  amount: number;
  paymentDay: number;
  cycle: 'MONTH' | 'WEEK';
  academy: {
    name: string;
  };
  daysUntil?: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentPlan[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    academyId: '',
    amount: '',
    paymentDay: '',
    cycle: 'MONTH' as 'MONTH' | 'WEEK',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, academiesRes] = await Promise.all([
        fetch('/api/payment/upcoming'),
        fetch('/api/academy'),
      ]);
      const paymentsData = await paymentsRes.json();
      const academiesData = await academiesRes.json();
      setPayments(paymentsData.payments || []);
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
    if (!formData.academyId || !formData.amount || !formData.paymentDay) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academyId: parseInt(formData.academyId),
          amount: parseInt(formData.amount),
          paymentDay: parseInt(formData.paymentDay),
          cycle: formData.cycle,
        }),
      });

      if (res.ok) {
        setFormData({ academyId: '', amount: '', paymentDay: '', cycle: 'MONTH' });
        setShowAddModal(false);
        await fetchData();
      }
    } catch (error) {
      console.error('Error creating payment plan:', error);
    } finally {
      setSubmitting(false);
    }
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
          <h2 className="text-2xl font-bold text-white">납부 관리</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            disabled={academies.length === 0}
          >
            + 납부 계획 추가
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
        ) : payments.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-xl mb-2">💳</p>
            <p className="text-gray-400 mb-4">등록된 납부 계획이 없습니다</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              첫 납부 계획 추가하기
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">곧 납부할 항목</h3>
            <div className="space-y-3">
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  academy={payment.academy.name}
                  amount={payment.amount}
                  paymentDay={payment.paymentDay}
                  cycle={payment.cycle}
                  daysUntil={payment.daysUntil || 0}
                />
              ))}
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">납부 계획 추가</h3>
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
                    금액 *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="예: 150000"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    납부 주기 *
                  </label>
                  <select
                    value={formData.cycle}
                    onChange={(e) => setFormData({ ...formData, cycle: e.target.value as 'MONTH' | 'WEEK' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="MONTH">매월</option>
                    <option value="WEEK">매주</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    납부일 *
                  </label>
                  <input
                    type="number"
                    value={formData.paymentDay}
                    onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder={formData.cycle === 'MONTH' ? '예: 5 (매월 5일)' : '예: 1 (매주 월요일)'}
                    min="1"
                    max={formData.cycle === 'MONTH' ? '31' : '7'}
                    required
                  />
                  {formData.cycle === 'WEEK' && (
                    <p className="text-xs text-gray-400 mt-1">
                      1=월요일, 2=화요일, 3=수요일, 4=목요일, 5=금요일, 6=토요일, 7=일요일
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ academyId: '', amount: '', paymentDay: '', cycle: 'MONTH' });
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

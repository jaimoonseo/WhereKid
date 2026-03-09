'use client';

import { formatCurrency } from '@/lib/utils';

interface PaymentCardProps {
  academy: string;
  amount: number;
  paymentDay: number;
  cycle: 'MONTH' | 'WEEK';
  daysUntil?: number;
}

export default function PaymentCard({
  academy,
  amount,
  paymentDay,
  cycle,
  daysUntil,
}: PaymentCardProps) {
  const isUrgent = daysUntil !== undefined && daysUntil <= 7;

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
        isUrgent
          ? 'bg-orange-500/10 border-orange-500/50'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{academy}</h3>
          <p className="text-2xl font-bold text-blue-400">
            {formatCurrency(amount)}
          </p>
        </div>
        {daysUntil !== undefined && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isUrgent
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {daysUntil === 0 ? '오늘' : `${daysUntil}일 후`}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>매{cycle === 'MONTH' ? '월' : '주'}</span>
        <span>•</span>
        <span>{paymentDay}일</span>
      </div>
    </div>
  );
}

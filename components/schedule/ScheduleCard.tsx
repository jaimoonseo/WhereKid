'use client';

import { formatTime } from '@/lib/utils';

interface ScheduleCardProps {
  title: string;
  academy: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  isPast?: boolean;
}

export default function ScheduleCard({
  title,
  academy,
  startTime,
  endTime,
  isActive = false,
  isPast = false,
}: ScheduleCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
        isActive
          ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/30'
          : isPast
          ? 'bg-gray-800/40 border-gray-700/40 opacity-50'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-1 flex items-center gap-2 ${isPast ? 'text-gray-500' : 'text-white'}`}>
            {isActive && <span className="text-2xl">😊</span>}
            {academy}
          </h3>
          {title && title !== academy && (
            <p className={`text-sm mb-2 ${isPast ? 'text-gray-600' : 'text-gray-400'}`}>{title}</p>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-medium ${isPast ? 'text-gray-600' : 'text-blue-400'}`}>
              {formatTime(startTime)}
            </span>
            <span className={isPast ? 'text-gray-700' : 'text-gray-500'}>~</span>
            <span className={`font-medium ${isPast ? 'text-gray-600' : 'text-blue-400'}`}>
              {formatTime(endTime)}
            </span>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-500 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-white">진행중</span>
          </div>
        )}
      </div>
    </div>
  );
}

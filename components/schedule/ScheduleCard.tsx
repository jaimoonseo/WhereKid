'use client';

import { formatTime } from '@/lib/utils';

interface ScheduleCardProps {
  title: string;
  academy: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export default function ScheduleCard({
  title,
  academy,
  startTime,
  endTime,
  isActive = false,
}: ScheduleCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
        isActive
          ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/30'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {academy}
          </h3>
          {title && title !== academy && (
            <p className="text-sm text-gray-400 mb-2">{title}</p>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-400 font-medium">
              {formatTime(startTime)}
            </span>
            <span className="text-gray-500">~</span>
            <span className="text-blue-400 font-medium">
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

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
  const handleShare = async () => {
    const shareText = isActive
      ? `우리 아이가 지금 ${academy}(${formatTime(startTime)}-${formatTime(endTime)})에 있어요 📚`
      : `${academy} 스케줄: ${formatTime(startTime)}-${formatTime(endTime)} 📚`;

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('📋 클립보드에 복사되었습니다!');
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

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
      <div className="flex items-start justify-between gap-3">
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
        <div className="flex flex-col gap-2 items-end">
          {isActive && (
            <div className="flex items-center gap-1 px-3 py-1 bg-green-500 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-white">진행중</span>
            </div>
          )}
          {!isPast && (
            <button
              onClick={handleShare}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              aria-label="공유하기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

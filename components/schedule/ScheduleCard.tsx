'use client';

import { formatTime } from '@/lib/utils';

interface ScheduleCardProps {
  title: string;
  academy: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  isPast?: boolean;
  scheduleId?: number;
}

export default function ScheduleCard({
  title,
  academy,
  startTime,
  endTime,
  isActive = false,
  isPast = false,
  scheduleId,
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
      } catch {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('📋 클립보드에 복사되었습니다!');
      } catch {
        console.error('Failed to copy');
      }
    }
  };

  const handleSendSMS = async () => {
    if (!scheduleId) {
      alert('❌ 스케줄 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          sendToDefault: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.sent > 0) {
        alert(`✅ SMS 전송 완료!\n\n${data.sent}건 전송됨\n\n* 현재는 개발 모드로 실제 SMS는 전송되지 않습니다.`);
      } else if (data.error) {
        alert(`❌ SMS 전송 실패\n\n${data.error}\n\n설정 > 연락처 관리에서 기본 연락처를 설정하세요.`);
      }
    } catch (error) {
      alert('❌ SMS 전송 실패\n\n' + (error instanceof Error ? error.message : '알 수 없는 오류'));
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
            <>
              <button
                onClick={handleSendSMS}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                aria-label="SMS 전송"
                title="기본 연락처로 SMS 전송"
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                aria-label="공유하기"
                title="다른 앱으로 공유"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
